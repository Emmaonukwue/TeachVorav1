const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Make sure these functions exist in authController.js!
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.post('/register', authController.postRegister);
router.get('/logout', authController.logout);

module.exports = router;