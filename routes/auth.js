const express = require('express');
const {
  signup,
  signin,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyToken
} = require('../controller/auth');

const router = express.Router();

router.route('/signup').post(signup);
router.route('/signin').post(signin);

router.route('/change-password').patch(verifyToken, updatePassword);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password/:token').post(resetPassword);

module.exports = router;
