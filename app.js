const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const tourRouter = require('./routes/tour');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const globalError = require('./controller/error');
const notFound = require('./controller/not-found');

const app = express();
// set security http headers
app.use(helmet());

// rate limiter middelware
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this ip, please try agin in an hour!'
});
app.use('/api', limiter);

// Developement logging
app.use(morgan('dev'));

// boder parser
app.use(express.json({ limit: '10kb' }));

// data sanitization against noSql query injection
app.use(mongoSanitize());

// data sanitization against XSS attacks
app.use(xss());

// to avoid parameter/query pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
      'ratingsAverage'
    ]
  })
);

// serving static files
app.use(express.static(`${__dirname}/public`));

// Routes
app.use('/api/v1/tour', tourRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);

// run if no route found
// make sure you add this in the end
app.use('*', notFound);

// global error handler
app.use(globalError);

module.exports = app;
