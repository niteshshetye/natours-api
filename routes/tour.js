const express = require('express');
const reviewRouter = require('./review');
const {
  getTourList,
  createTour,
  getTourById,
  updateTour,
  deleteTour,
  getTop5Tours,
  getTourStats,
  getYearlyPlan,
  toursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages
} = require('../controller/tour');
const { verifyToken, allowedRoles } = require('../controller/auth');

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

router.route('/stats').get(getTourStats);
router.route('/yearly-plan/:year').get(getYearlyPlan);

// Route Aliasing
router.route('/top-5-cheap').get(getTop5Tours, getTourList);

router.use(verifyToken);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(toursWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);

router
  .route('/')
  .get(getTourList)
  .post(allowedRoles('admin', 'lead-guide'), createTour);

router
  .route('/:id')
  .get(getTourById)
  .patch(
    allowedRoles('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(allowedRoles('admin', 'lead-guide'), deleteTour);

module.exports = router;
