const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const { Email } = require('../utils/emailer');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const prepareResponse = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  });

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  prepareResponse(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // REVIEW: Check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // REVIEW: Check if user exists && password is correct
  const user = await User.findOne({
    email
  }).select('+password');

  if (!user || !(await user.verifyPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // REVIEW: If all is ok, send token to client

  prepareResponse(user, 200, req, res);
});

exports.logout = catchAsync(async (req, res) => {
  res.clearCookie('jwt', 'logmeout', {
    expires: new Date(Date.now() - 10000),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  });

  res.status(200).json({
    status: 'success'
  });
});

exports.verifyAuth = catchAsync(async (req, res, next) => {
  // REVIEW: Get token and check if its there
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError('Access Forbidden. Please log in.', 401));
  }
  // REVIEW: Verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // REVIEW: If verification is good, check if user still exists
  const currUser = await User.findById(decoded.id);
  if (!currUser) {
    return next(
      new AppError('User belonging to this token does not exist', 401)
    );
  }
  // REVIEW: Check if user changed password after JWT issuance
  if (currUser.changedPassword(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please log back in', 401)
    );
  }

  req.user = currUser;
  res.locals.user = currUser;
  next();
});

// Rendered Pages Only, No errors!!!
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );

    const currUser = await User.findById(decoded.id);
    if (!currUser) {
      return next();
    }

    if (currUser.changedPassword(decoded.iat)) {
      return next();
    }
    res.locals.user = currUser;
    return next();
  }
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // REVIEW: Find user based on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('Could not find this email address', 404));
  }
  // Generate the random reset password
  const resetToken = user.resetPasswordToken();
  await user.save({ validateBeforeSave: false });
  // Send it to user's email

  const resetURL = `${req.protocol}://${req.hostname}:3000/api/v1/users/resetpassword/${resetToken}`;

  try {
    await new Email(user, resetURL).sendPasswordReset();
    // await Email({
    //   email: user.email,
    //   subject: 'Your password reset token (only valid for 10 mins).',
    //   message
    // });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Something went wrong', 500));
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) lookup user based on reset token
  const hash = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hash,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired and there is a user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save({ validateBeforeSave: true });
  // 3) Update changedPasswordAt prop for user

  // Defined with a pre save hook on User model

  // 4) Log the user in , send jwt
  prepareResponse(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from User
  const user = await User.findById(req.user._id).select('+password');

  if (!user) return next(new AppError('User does not exist', 404));

  // 2) check if Posted current password is correct with DB
  if (!(await user.verifyPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError('Password is incorrect!', 401));
  // 3) If so, then update password

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save({ validateBeforeSave: true });
  // 4) Log user in, send JWT

  prepareResponse(user, 200, req, res);
});
