import cv2

def extract_frames(video_path: str, num_frames=10):
    cap = cv2.VideoCapture(video_path)
    frames = []
    
    if not cap.isOpened():
        return frames

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    step = max(1, total_frames // num_frames)

    count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if count % step == 0 and len(frames) < num_frames:
            frames.append(frame)
        count += 1

    cap.release()
    return frames
