const expressRouter = require('express').Router();
const { registerUser, loginUser } = require('../controllers/authController');

expressRouter.post('/register', registerUser);
expressRouter.post('/login', loginUser);

module.exports = expressRouter;
