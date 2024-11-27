const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userSchema');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = payload => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRESIN
  });
};

const verifyToken = token => {
  // return jwt.verify(token, process.env.JWT_SECRET);
  return promisify(jwt.verify)(token, process.env.JWT_SECRET);
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

  return res.status(200).json({
    status: 'success',
    data: { token, user: { email: user.email, name: user.name } }
  });
});

exports.verifyToken = catchAsync(async (req, res, next) => {
  // check is authorization key present in header or not
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer')
  )
    return next(new AppError(401, 'Unathorized user'));

  const token = req.headers.authorization.split(' ')[1];

  // check is token is present or not
  if (!token) return next(new AppError(401, 'Unathorized user'));

  // decode token details
  const tokenDetails = await verifyToken(token);

  // fetch the user
  const user = await User.findById(tokenDetails.id);

  // check is user present or not
  if (!user) {
    return next(
      new AppError(401, 'User belonging to token is no longer exist')
    );
  }

  // check if after login user changed the password or not if yes than relogin required
  if (user.changedPassword(tokenDetails.iat)) {
    return next(
      new AppError(401, 'User recently changed password, please login again')
    );
  }

  req.user = user;

  next();
});
