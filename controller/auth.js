const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = payload => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRESIN
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword
  });

  const token = signToken({ id: user._id, email: user.email });

  return res.status(201).json({
    status: 'success',
    data: {
      token,
      user: {
        name: user.name,
        email: user.email
      }
    }
  });
});

exports.signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError(400, 'Please provide email and password!'));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(401, 'Incorrect email or password'));
  }

  const token = signToken({ id: user._id, email: user.email });

  return res.status(200).json({ status: 'success', data: { token } });
});
