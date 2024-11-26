const AppError = require('../utils/appError');

module.exports = (req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this server!`));
};
