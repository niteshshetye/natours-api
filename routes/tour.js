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

const router = express.Router();

router.route('/stats').get(getTourStats);
router.route('/yearly-plan/:year').get(getYearlyPlan);

// Route Aliasing
router.route('/top-5-cheap').get(getTop5Tours, getTourList);

router
  .route('/')
  .get(getTourList)
  .post(createTour);

router
  .route('/:id')
  .get(getTourById)
  .patch(updateTour)
  .delete(deleteTour);

module.exports = router;
