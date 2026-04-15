import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import ReduceLROnPlateau
from torchvision import datasets, transforms
from torch.utils.data import DataLoader, random_split
import cv2
from PIL import Image
import glob
import numpy as np
import kagglehub
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import json

from models.deepfake_model import HybridDeepfakeModel, extract_fft_features, DEVICE

# 1. Configuration
BATCH_SIZE = 16 # Reduce batch size slightly to fit EfficientNet + FFT in memory
NUM_EPOCHS = 15
LEARNING_RATE = 0.001
PATIENCE = 3 # Early stopping
MODEL_SAVE_PATH = 'deepfake_hybrid_weights.pt'
DATA_DIR = 'dataset'

def train_model():
    print(f"Using device: {DEVICE}")
    print("Downloading dataset from Kaggle...")
    path = kagglehub.dataset_download("ucimachinelearning/deep-fake-detection-cropped-dataset")
    print("Path to dataset files:", path)
    
    global DATA_DIR
    DATA_DIR = path

    # 2. Data Transforms (More Augmentation)
    data_transforms = {
        'train': transforms.Compose([
            transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
            transforms.GaussianBlur(kernel_size=(5, 9), sigma=(0.1, 5)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        'val': transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
    }

    print("Loading data from local folders...")
    dataset_path = os.path.join(DATA_DIR, 'DFDC_Dataset')
    
    if not os.path.exists(dataset_path):
        print(f"Error: Could not find 'DFDC_Dataset' inside {DATA_DIR}")
        return

    # Custom Video Dataset
    class VideoFrameDataset(torch.utils.data.Dataset):
        def __init__(self, root_dir):
            self.root_dir = root_dir
            self.classes = ['Fake', 'Real']
            self.class_to_idx = {cls_name: i for i, cls_name in enumerate(self.classes)}
            self.samples = []
            
            for cls_name in self.classes:
                cls_dir = os.path.join(root_dir, cls_name)
                if not os.path.exists(cls_dir):
                    continue
                for filepath in glob.glob(os.path.join(cls_dir, '*.mp4')):
                    self.samples.append((filepath, self.class_to_idx[cls_name]))
                    
        def __len__(self):
            return len(self.samples)
            
        def __getitem__(self, idx):
            return self.samples[idx]

    full_dataset = VideoFrameDataset(dataset_path)
    class_names = full_dataset.classes
    print(f"Classes found: {class_names}")
    print(f"Total videos found: {len(full_dataset)}")

    if len(full_dataset) == 0:
        print("No videos found! Stopping training.")
        return

    # Split 80% train, 20% val
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset_raw, val_dataset_raw = random_split(full_dataset, [train_size, val_size])

    # Apply transforms wrapper returning both spatial and frequency features
    class HybridTransformDataset(torch.utils.data.Dataset):
        def __init__(self, subset, transform):
            self.subset = subset
            self.transform = transform
            
        def __len__(self):
            return len(self.subset)
            
        def __getitem__(self, idx):
            filepath, label = self.subset.dataset.samples[self.subset.indices[idx]]
            
            cap = cv2.VideoCapture(filepath)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, frame_count // 2))
            ret, frame = cap.read()
            cap.release()
            
            if not ret or frame is None:
                frame = np.zeros((224, 224, 3), dtype=np.uint8)
            else:
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
            image = Image.fromarray(frame)
            
            # Extract FFT before spatial augmentation modifies frequency spectrum
            fft_features = extract_fft_features(image)
            
            if self.transform:
                spatial_image = self.transform(image)
            else:
                spatial_image = transforms.ToTensor()(image)
                
            return spatial_image, torch.FloatTensor(fft_features), label

    image_datasets = {
        'train': HybridTransformDataset(train_dataset_raw, data_transforms['train']),
        'val': HybridTransformDataset(val_dataset_raw, data_transforms['val'])
    }
    
    dataloaders = {x: DataLoader(image_datasets[x], batch_size=BATCH_SIZE, shuffle=(x=='train'), num_workers=0)
                   for x in ['train', 'val']}
    
    dataset_sizes = {x: len(image_datasets[x]) for x in ['train', 'val']}

    # 3. Initialize Model
    print("Initializing Hybrid Spatial-Frequency Model based on EfficientNet-B0...")
    model = HybridDeepfakeModel().to(DEVICE)

    # 4. Loss and Optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-4) # Added weight decay
    scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2, verbose=True)

    # 5. Training Loop with Early Stopping
    print("Starting training...")
    best_val_loss = float('inf')
    epochs_no_improve = 0

    for epoch in range(NUM_EPOCHS):
        print(f'Epoch {epoch}/{NUM_EPOCHS - 1}')
        print('-' * 10)

        for phase in ['train', 'val']:
            if phase == 'train':
                model.train()
            else:
                model.eval()

            running_loss = 0.0
            running_corrects = 0
            
            val_preds = []
            val_labels = []
            val_probs = []

            for spatial_inputs, fft_inputs, labels in dataloaders[phase]:
                spatial_inputs = spatial_inputs.to(DEVICE)
                fft_inputs = fft_inputs.to(DEVICE)
                labels = labels.to(DEVICE)

                optimizer.zero_grad()

                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(spatial_inputs, fft_inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    if phase == 'train':
                        loss.backward()
                        optimizer.step()
                        
                    elif phase == 'val':
                        probs = torch.nn.functional.softmax(outputs, dim=1)[:, 1].cpu().tolist() # Prob of Real
                        val_preds.extend(preds.cpu().tolist())
                        val_labels.extend(labels.cpu().tolist())
                        val_probs.extend(probs)

                running_loss += loss.item() * spatial_inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            epoch_loss = running_loss / dataset_sizes[phase]
            epoch_acc = running_corrects.double() / dataset_sizes[phase]

            print(f'{phase} Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}')

            if phase == 'val':
                scheduler.step(epoch_loss)
                
                # Check early stopping
                if epoch_loss < best_val_loss:
                    best_val_loss = epoch_loss
                    epochs_no_improve = 0
                    torch.save(model.state_dict(), MODEL_SAVE_PATH)
                    print(f"[*] Validation loss improved! Model saved to '{MODEL_SAVE_PATH}'.")
                    
                    # Generate Evaluation Metrics
                    print("--- Evaluation Metrics ---")
                    print(classification_report(val_labels, val_preds, target_names=class_names))
                    cm = confusion_matrix(val_labels, val_preds)
                    roc_auc = roc_auc_score(val_labels, val_probs) if len(set(val_labels)) > 1 else "N/A"
                    print(f"ROC AUC Score: {roc_auc}")
                    
                    # Save metrics for Frontend display
                    with open('metrics.json', 'w') as f:
                         json.dump({
                             "accuracy": float(epoch_acc),
                             "roc_auc": float(roc_auc) if roc_auc != "N/A" else 0,
                             "confusion_matrix": cm.tolist()
                         }, f)
                else:
                    epochs_no_improve += 1
                    print(f"Early stop counter: {epochs_no_improve}/{PATIENCE}")
                    if epochs_no_improve >= PATIENCE:
                        print("Early stopping triggered!")
                        return

if __name__ == '__main__':
    train_model()
