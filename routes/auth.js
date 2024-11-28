const express = require('express');
const {
  signup,
  signin,
  forgotPassword,
  resetPassword
} = require('../controller/auth');

const router = express.Router();

router.route('/signup').post(signup);
router.route('/signin').post(signin);

router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password/:token').post(resetPassword);

module.exports = router;
