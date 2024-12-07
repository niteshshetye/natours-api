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

  const review = await Review.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!review) {
    return next(new AppError(404, 'Review not found!'));
  }

  if (req.body.review) {
    review.review = req.body.review;
  }

  if (req.body.rating) {
    review.rating = req.body.rating;
  }

  const newReview = await review.save();

  return res.status(200).json({ status: 'sucess', data: { newReview } });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  const reviewId = req.params.id;

  const review = await Review.findOne({ _id: reviewId, userId: req.user._id });

  if (!review) {
    return next(new AppError(404, 'You not allowed to delete others review!'));
  }

  await Review.deleteOne({
    _id: reviewId
  });

  return res.status(200).json({ status: 'sucess', data: null });
});
