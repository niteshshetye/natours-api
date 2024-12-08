const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userSchema');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },

//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user._id}-${Date.now()}.${ext}`);
//   }
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Only image are allowed!'), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

const createUpdateBody = (originalBody, ...allowedFields) => {
  const modifiedBody = {};
  Object.keys(originalBody).forEach(body => {
    if (allowedFields.includes(body)) modifiedBody[body] = originalBody[body];
  });
  return modifiedBody;
};

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
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

  if (req.file) body.photoURL = req.file.filename;

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
