const stripe = require('stripe')(process.env.STRIPE_SECRETE_KEY);
const Booking = require('../models/bookintSchema');
const Tour = require('../models/tourSchema');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.checkoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  if (!tour) {
    return next(new AppError(404, 'Payment for respective tour is not exist'));
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary
          },
          unit_amount: tour.price * 100
        },
        quantity: 1
      }
    ]
  });

  res.status(200).json({ status: 'sucess', data: { session } });
});

exports.saveBooking = catchAsync(async (req, res, next) => {
  const { tourId, price } = req.query;

  if (!tourId && !price)
    return next(new AppError(404, 'Please provide requried field'));

  const booking = await Booking.create({ tourId, userId: req.user._id, price });

  return res.status(201).json({ status: 'sucess', data: { booking } });
});

exports.getMyBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ userId: req.user._id });

  return res.status(200).json({ status: 'sucess', data: { bookings } });
});
