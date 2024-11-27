const express = require('express');
const {
  getTourList,
  createTour,
  getTourById,
  updateTour,
  deleteTour,
  getTop5Tours,
  getTourStats,
  getYearlyPlan
} = require('../controller/tour');
const { verifyToken } = require('../controller/auth');

const router = express.Router();

router.route('/stats').get(getTourStats);
router.route('/yearly-plan/:year').get(getYearlyPlan);

// Route Aliasing
router.route('/top-5-cheap').get(getTop5Tours, getTourList);

router
  .route('/')
  .get(verifyToken, getTourList)
  .post(verifyToken, createTour);

router
  .route('/:id')
  .get(getTourById)
  .patch(updateTour)
  .delete(deleteTour);

module.exports = router;
