const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking') {
    res.locals.alert = `Your booking was successful. Check your email for confirmation. If you're booking doesn't show up immediately, please come back later. 👍`;
  }
  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();
  // 2) Build template

  // 3) render that template using tour data from step 1
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  const tour = await Tour.findOne({
    slug
  }).populate({
    path: 'reviews',
    select: 'review rating user'
  });

  if (!tour) {
    return next(
      new AppError(
        'This tour does not exist. Please try your request again.',
        404
      )
    );
  }

  res
    .status(200)
    // .set(
    //   'Content-Security-Policy',
    //   "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://cdn.jsdelivr.net 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    // )
    .render('tour', {
      title: `${tour.name} Tour`,
      tour
    });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res
    .status(200)
    // .set(
    //   'Content-Security-Policy',
    //   "connect-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://cdn.jsdelivr.net 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    // )

    .render('login', {
      title: 'Log into your account'
    });
});

exports.getSignUpForm = catchAsync(async (req, res, next) => {
  res.status(200).render('signup', {
    title: 'Sign Up!'
  });
});

exports.getAccount = catchAsync(async (req, res, next) => {
  res.status(200).render('account', {
    title: `Welcome, ${res.locals.user.name.split(' ')[0]}`,
    user: req.user
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const { name, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    { runValidators: true, new: true }
  );
  res.status(200).render('account', {
    title: `Your Account`,
    user: user
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });

  const tours = await Promise.all(
    bookings.map(async el => {
      return await Tour.findById(el.tour);
    })
  );
  // const tourId = bookings.map(el => el.tour);
  // const tours = await Tour.find({ _id: { $in: tourId } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});
