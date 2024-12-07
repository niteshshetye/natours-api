const Review = require('../models/reviewSchema');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllReview = catchAsync(async (req, res, next) => {
  const filter = {};
  if (req.params.tourId) filter.tourId = req.params.tourId;

  const reviews = await Review.find(filter);

  return res.status(200).json({ status: 'sucess', data: { reviews } });
});

exports.createReview = catchAsync(async (req, res, next) => {
  const review = await Review.create({
    review: req.body.review,
    rating: req.body.rating,
    tourId: req.params.tourId || req.body.tourId,
    userId: req.user._id
  });

  return res.status(201).json({ status: 'sucess', data: { review } });
});

exports.updateReview = catchAsync(async (req, res, next) => {
  if (!req.body.review && !req.body.rating) {
    return next(new AppError(404, 'Please check payload!'));
  }

  // const review = await Review.findOne({
  //   _id: req.params.id,
  //   userId: req.user._id
  // });

  // if (!review) {
  //   return next(new AppError(404, 'You not allowed to update others review!'));
  // }

  const updatedReview = await Review.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!updatedReview) {
    return next(new AppError(404, 'You not allowed to update others review!'));
  }

  return res
    .status(200)
    .json({ status: 'sucess', data: { review: updatedReview } });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  const reviewId = req.params.id;

  // const review = await Review.findOne({ _id: reviewId, userId: req.user._id });

  // if (!review) {
  //   return next(new AppError(404, 'You not allowed to delete others review!'));
  // }

  await Review.findByIdAndDelete(reviewId);

  return res.status(204).json({ status: 'sucess', data: null });
});
