const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userSchema');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = payload => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRESIN
  });
};

const verifyToken = token => {
  // return jwt.verify(token, process.env.JWT_SECRET);
  return promisify(jwt.verify)(token, process.env.JWT_SECRET);
};

const createSendToken = (statusCode, user, res) => {
  const token = signToken({ id: user._id, email: user.email });

  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOption.secure = true;

  res.cookie('jwt', token, cookieOption);

  return res.status(statusCode).json({
    status: 'success',
    data: {
      token,
      user: {
        name: user.name,
        email: user.email
      }
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  const email = new Email({ email: user.email, name: user.name }, url);
  await email.sendWelcome();

  return createSendToken(201, user, res);
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

  return createSendToken(200, user, res);
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

exports.allowedRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, 'You dont have permission to perform this action')
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError(404, 'There is no user with email address'));
  }

  // in below function we are genrating the reset token and saving it in database
  // hence we have to do user.save()
  const passwordResetToken = user.generateResetPasswordToken();
  await user.save();

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/reset-password/${passwordResetToken}`;

  try {
    const email = new Email({ email: user.email, name: user.name }, resetURL);
    await email.sendPasswordReset();

    res
      .status(200)
      .json({ status: 'success', message: 'Link sent to your email!' });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError(500, 'Failed to send email'));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token: resetToken } = req.params;

  // get user based on token
  const encryptedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // check is token is expires and find the user
  const user = await User.findOne({
    passwordResetToken: encryptedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError(404, 'Token is invalid or expired'));
  }

  // update changePasswordAt , and password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  await user.save();

  // log the user in send jwt
  return createSendToken(200, user, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get the user from collection
  const user = await User.findOne({
    email: req.user.email
  }).select('+password');

  if (!user) {
    return next(new AppError(404, 'User with this email is not exist'));
  }

  // 2) check if the posted password is correct
  const isPasswordMatched = await user.correctPassword(
    req.body.currentPassword,
    user.password
  );

  if (!isPasswordMatched) {
    return next(new AppError(404, 'Password does not matched!'));
  }

  // 3) if so, updated password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  // 4) Log user in, send jwt
  return createSendToken(200, user, res);
});
