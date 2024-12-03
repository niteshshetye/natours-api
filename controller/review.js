const Review = require('../models/reviewSchema');
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
