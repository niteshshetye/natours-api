const User = require('../models/userSchema');
const catchAsync = require('../utils/catchAsync');

exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);
  return res.status(201).json({ status: 'success', data: { user } });
});

exports.signin = catchAsync(async (req, res, next) => {
  //   console.log(req.body);
  //   const user = await User.create(req.body);
  //   console.log(user);
  return res.status(201).json({ status: 'success', data: {} });
});
