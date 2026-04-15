const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const ML_KEEPALIVE_URL = process.env.ML_KEEPALIVE_URL || 'https://deep-fake-detection-ml.onrender.com/docs';

const pingMlService = async () => {
  try {
    await fetch(ML_KEEPALIVE_URL);
    console.log('ML pinged');
  } catch (error) {
    console.log('Ping failed');
  }
};

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/predict', require('./routes/predictRoutes'));

// Create uploads directory if not exists
const fs = require('fs');
const path = require('path');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

pingMlService();
setInterval(pingMlService, 5 * 60 * 1000);
