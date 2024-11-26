const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tour');
const authRouter = require('./routes/auth');
const globalError = require('./controller/error');
const notFound = require('./controller/not-found');

const app = express();

// middelware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

// Routes
app.use('/api/v1/tour', tourRouter);
app.use('/api/v1/auth', authRouter);

// run if no route found
// make sure you add this in the end
app.use('*', notFound);

// global error handler
app.use(globalError);

module.exports = app;
