const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalName: { type: String, required: true },
  fileType: { type: String, required: true }, // 'image' or 'video'
  result: { type: String, required: true }, // 'Real' or 'Fake'
  realProb: { type: Number, required: true },
  fakeProb: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Prediction', predictionSchema);
