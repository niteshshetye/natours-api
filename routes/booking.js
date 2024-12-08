const express = require('express');
const { verifyToken } = require('../controller/auth');
const {
  checkoutSession,
  saveBooking,
  getMyBookings
} = require('../controller/booking');

const router = express.Router();

router.use(verifyToken);

router.get('/my-bookings', getMyBookings);
router.get('/checkout-session/:tourId', checkoutSession);
router.post('/save-booking', saveBooking);

module.exports = router;
