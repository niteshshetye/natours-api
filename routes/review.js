const express = require('express');
const { getAllReview, createReview } = require('../controller/review');
const { verifyToken, allowedRoles } = require('../controller/auth');

// {mergeParams: true} helps to get parameter => /tour/:tourId/reviews
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(verifyToken, getAllReview)
  .post(verifyToken, allowedRoles('user'), createReview);

module.exports = router;
