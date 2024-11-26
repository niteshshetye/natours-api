const AppError = require('../utils/appError');

const sendErrorDev = (error, res) => {
  return res.status(error.statusCode).json({
    statusCode: error.statusCode,
    error: error,
    status: error.status,
    message: error.message,
    stack: error.stack
  });
};

const sendErrorProd = (error, res) => {
  if (error.isOperational)
    return res.status(error.statusCode).json({
      statusCode: error.statusCode,
      status: error.status,
      message: error.message
    });

  console.error('ERROR:  ', error);

  return res.status(500).json({
    statusCode: 500,
    status: 'error',
    message: 'Something went wrong'
  });
};

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(400, message);
};

const handleDuplicateErrorDB = err => {
  const [value] = err.errmsg.match(/(["'])(\\?.)*?\1/);
  const message = `Duplicate field value: ${value}, please use another value!`;
  return new AppError(400, message);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(error => error.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(400, message);
};

module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  }

  if (process.env.NODE_ENV === 'production') {
    let err = { ...error };

    if (error.name === 'CastError') {
      err = handleCastErrorDB(error);
    }

    if (error.code === 11000) {
      err = handleDuplicateErrorDB(error);
    }

    if (error.name === 'ValidationError') {
      err = handleValidationErrorDB(error);
    }

    sendErrorProd(err, res);
  }
};
