import cv2
import numpy as np
import torch
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import torch.nn as nn
import os

# ─── Configuration ───────────────────────────────────────────────
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
FAKE_THRESHOLD = 0.50  # We output raw probabilities now

# ─── Hybrid EfficientNet-B0 + FFT Model ────────────────────────────
class HybridDeepfakeModel(nn.Module):
    def __init__(self):
        super(HybridDeepfakeModel, self).__init__()
        # EfficientNet stream (Spatial)
        self.efficientnet = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
        # Remove the classifier to get raw features (1280 dim)
        self.cnn_features = self.efficientnet.classifier[1].in_features
        self.efficientnet.classifier = nn.Identity()
        
        # FFT processing head (we'll flatten FFT center crop and pass through FC layer)
        # Assuming 64x64 central crop of FFT magnitude spectrum -> 4096 dims
        self.fft_fc = nn.Sequential(
            nn.Linear(4096, 256),
            nn.ReLU(),
            nn.Dropout(p=0.3)
        )
        
        # Final classifier
        self.classifier = nn.Sequential(
            nn.Linear(self.cnn_features + 256, 512),
            nn.ReLU(),
            nn.Dropout(p=0.4),
            nn.Linear(512, 2) # Real vs Fake
        )

    def forward(self, x, fft_x):
        # x: [B, 3, 224, 224]
        # fft_x: [B, 4096]
        spatial_features = self.efficientnet(x)
        freq_features = self.fft_fc(fft_x)
        
        # concatenate
        combined = torch.cat((spatial_features, freq_features), dim=1)
        out = self.classifier(combined)
        return out

model = HybridDeepfakeModel().to(DEVICE)

# Load trained weights if available
weights_path = os.path.join(os.path.dirname(__file__), '..', 'deepfake_hybrid_weights.pt')
legacy_weights_path = os.path.join(os.path.dirname(__file__), '..', 'deepfake_efficientnet_weights.pt')

if os.path.exists(weights_path):
    print(f"Loading trained Hybrid weights from {weights_path}...")
    model.load_state_dict(torch.load(weights_path, map_location=DEVICE))
elif os.path.exists(legacy_weights_path):
    print(f"Warning: Loading legacy EfficientNet weights. Features might misalign if FFT wasn't trained!")
    # Attempt strict=False just in case we can use partial weights, but it's dangerous, so we don't.
    print("Please run train.py to generate deepfake_hybrid_weights.pt")
else:
    print("Warning: No trained weights found. Using pre-trained weights for spatial. Run train.py!")

model.eval()

# ─── Preprocessing Pipeline ───────
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

def extract_fft_features(image_gray):
    """
    Computes 2D FFT, extracts magnitude spectrum, and grabs center 64x64 crop.
    """
    if not isinstance(image_gray, np.ndarray):
        image_gray = np.array(image_gray.convert('L'))
        
    image_gray = cv2.resize(image_gray, (224, 224))
    f_transform = np.fft.fft2(image_gray)
    f_shift = np.fft.fftshift(f_transform)
    magnitude_spectrum = 20 * np.log(np.abs(f_shift) + 1e-8) # Avoid log(0)
    
    # Center crop 64x64
    h, w = magnitude_spectrum.shape
    center_h, center_w = h // 2, w // 2
    crop = magnitude_spectrum[center_h-32:center_h+32, center_w-32:center_w+32]
    
    # Normalize features
    crop = (crop - np.mean(crop)) / (np.std(crop) + 1e-8)
    return crop.flatten()

def predict_image(image_path: str):
    """
    Predict if an image is Real or Fake using Hybrid Model.
    Returns Dictionary: {'result': "Fake"/"Real", 'realProb': int, 'fakeProb': int}
    """
    try:
        image = Image.open(image_path).convert('RGB')
        
        # Spatial Tensor
        input_tensor = preprocess(image)
        input_batch = input_tensor.unsqueeze(0).to(DEVICE)
        
        # FFT Tensor
        fft_features = extract_fft_features(image)
        fft_batch = torch.FloatTensor(fft_features).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            output = model(input_batch, fft_batch)

        # Softmax probabilities: index 0 = Fake, index 1 = Real
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        fake_prob = float(probabilities[0].item())
        real_prob = float(probabilities[1].item())

        result = "Fake" if fake_prob > FAKE_THRESHOLD else "Real"

        return {
            "result": result,
            "fakeProb": round(fake_prob * 100, 2),
            "realProb": round(real_prob * 100, 2)
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"result": "Unknown", "fakeProb": 0.0, "realProb": 0.0}


def predict_video(video_path: str):
    """
    Extract frames from a video and aggregate per-frame predictions.
    """
    from utils.video_processor import extract_frames

    frames = extract_frames(video_path, num_frames=10)

    if len(frames) == 0:
        return {"result": "Unknown", "fakeProb": 0.0, "realProb": 0.0}

    fake_probs = []
    real_probs = []

    for frame in frames:
        temp_path = "temp_frame.jpg"
        cv2.imwrite(temp_path, frame)
        res = predict_image(temp_path)
        
        fake_probs.append(res['fakeProb'])
        real_probs.append(res['realProb'])

    if os.path.exists("temp_frame.jpg"):
        os.remove("temp_frame.jpg")

    avg_fake = sum(fake_probs) / len(fake_probs)
    avg_real = sum(real_probs) / len(real_probs)

    result = "Fake" if avg_fake > FAKE_THRESHOLD * 100 else "Real"

    return {
        "result": result,
        "fakeProb": round(avg_fake, 2),
        "realProb": round(avg_real, 2)
    }
