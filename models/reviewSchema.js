const mongoose = require('mongoose');

// review, rating , createdAt, ref to tour, ref to user
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be above 0'],
      max: [5, 'Rating must be less than 5']
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tourId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true }, // without this virtual properties not will added in response
    toObject: { virtuals: true }
  }
);

reviewSchema.pre(/^find/, function(next) {
  // populate({
  //     path: 'tourId',
  //     select: 'name'
  //   }).
  this.populate({
    path: 'userId',
    select: 'name'
  });
  next();
});
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
