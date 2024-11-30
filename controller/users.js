const User = require('../models/userSchema');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const createUpdateBody = (originalBody, ...allowedFields) => {
  const modifiedBody = {};
  Object.keys(originalBody).forEach(body => {
    if (allowedFields.includes(body)) modifiedBody[body] = originalBody[body];
  });
  return modifiedBody;
};

exports.getUsersList = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(User, req.query)
    .filter()
    .sort('-created_at')
    .limitFields()
    .pagination(0, 5);

  const users = await features.query;

  res.status(200).json({ status: 'success', data: { users } });
});

exports.updateUserDetails = catchAsync(async (req, res, next) => {
  // if user try to update password than throw error
  if (req.body.password || req.body.confirmPassword) {
    return next(new AppError(400, 'This route is not for password updates'));
  }

  // update the user details
  const body = createUpdateBody(req.body, 'name', 'email');
  const user = await User.findByIdAndUpdate(req.user._id, body, {
    runValidators: true,
    new: true
  });

  if (!user) {
    return next(new AppError(404, 'User not found!'));
  }

  // return response
  return res.status(200).json({ status: 'success', data: { user } });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  return res
    .status(204)
    .json({ status: 'success', message: 'User deleted successfully' });
});
