const expressRouter = require('express').Router();
const upload = require('../middlewares/uploadMiddleware');
const { protect } = require('../middlewares/authMiddleware');
const { handlePredict, getHistory } = require('../controllers/predictController');

expressRouter.post('/upload', protect, upload.single('file'), handlePredict);
expressRouter.get('/history', protect, getHistory);

module.exports = expressRouter;
