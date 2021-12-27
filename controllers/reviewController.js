const Review = require('../models/reviewModel');
const handler = require('./handlerFactory');

exports.setTourUserId = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.getReview = handler.getOne(Review);

exports.createReview = handler.createOne(Review);

exports.getAllReviews = handler.getAll(Review);

exports.updateReview = handler.updateOne(Review);

exports.deleteReview = handler.deleteOne(Review);
