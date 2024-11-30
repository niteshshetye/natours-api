const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userSchema');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendEmail } = require('../utils/email');

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
  )}/api/v1/users/reset-password/${passwordResetToken}`;

  const message = `Forgot your password? Submit a PATCH request with new password and passwordConfirm to ${resetURL}.\n
   If you didn't forgot your password, please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

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
  const token = signToken({ id: user._id, email: user.email });

  return res.status(200).json({
    status: 'success',
    data: { token, user: { email: user.email, name: user.name } }
  });
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
  const token = signToken({ id: user._id, email: user.email });

  return res.status(200).json({
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
