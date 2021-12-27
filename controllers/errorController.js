const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFields = err => {
  const value = err.errmsg.match(/\{(\s*?.*?)*?\}/);
  const message = `Duplicate field value: ${value} already exists`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors)
    .map(msg => msg.message)
    .join('. ');
  const messages = `Invalid input data. ${errors
    .charAt(0)
    .toUpperCase()}${errors.substring(1)}`;
  return new AppError(messages, 400);
};

const handleJWTError = () =>
  new AppError(`Invalid signature. Please log in again`, 401);

const handleJWTExpiredError = () =>
  new AppError('Token has expired. Please log back in.', 401);

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  return res.status(err.statusCode).render('error', {
    title: 'Whoa!!! Something went wrong....',
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    console.error(`ERROR 🚨: ${err}`, err.message);

    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Whoa!!! Something went wrong....',
      msg: `${err.message}`
    });
  }
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong...'
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') err = handleCastErrorDB(err);
    if (err.code === 11000) err = handleDuplicateFields(err);
    if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') err = handleJWTError();
    if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();

    sendErrorProd(err, req, res);
  }
};
