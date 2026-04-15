const Prediction = require('../models/Prediction');
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const handlePredict = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const fileType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    
    // Create form data to send to Flask/FastAPI ML service
    const form = new FormData();
    form.append('file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Send to ML service
    const ML_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000/predict';
    const mlResponse = await axios.post(ML_URL, form, {
      headers: {
        ...form.getHeaders()
      }
    });

    const { result, realProb, fakeProb } = mlResponse.data;

    // Save prediction to DB
    const prediction = await Prediction.create({
      user: req.user._id,
      originalName: req.file.originalname,
      fileType,
      result,
      realProb: realProb || 0,
      fakeProb: fakeProb || 0
    });

    res.status(200).json(prediction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error processing prediction. Is ML service running?' });
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await Prediction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handlePredict, getHistory };
