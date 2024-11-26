const express = require('express');
const { signup, signin } = require('../controller/auth');

const router = express.Router();

router.route('/signup').post(signup);
router.route('/signin').get(signin);

module.exports = router;
