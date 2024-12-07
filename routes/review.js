const express = require('express');
const {
  getAllReview,
  createReview,
  updateReview,
  deleteReview
} = require('../controller/review');
const { verifyToken, allowedRoles } = require('../controller/auth');

// {mergeParams: true} helps to get parameter => /tour/:tourId/reviews
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(verifyToken, getAllReview)
  .post(verifyToken, allowedRoles('user'), createReview);

router
  .route('/:id')
  .patch(verifyToken, allowedRoles('user'), updateReview)
  .delete(verifyToken, allowedRoles('user'), deleteReview);

module.exports = router;
