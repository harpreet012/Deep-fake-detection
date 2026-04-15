from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import tempfile
import os

from models.deepfake_model import predict_image, predict_video

app = FastAPI(title="Deepfake Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "ML Service is running"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Save the uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_filepath = temp_file.name

    try:
        # Check if video or image
        mime_type = file.content_type
        if mime_type.startswith('video'):
            pred_data = predict_video(temp_filepath)
        else:
            pred_data = predict_image(temp_filepath)
            
        return pred_data
    finally:
        # Clean up
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
