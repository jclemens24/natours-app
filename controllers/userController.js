const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const handler = require('./handlerFactory');

const multerMemory = multer.memoryStorage();

const multerFilter = (req, file, er) => {
  if (file.mimetype.startsWith('image')) {
    er(null, true);
  } else {
    er(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerMemory,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const bodyChecks = {};
  Object.keys(obj).forEach(field => {
    if (allowedFields.includes(field)) bodyChecks[field] = obj[field];
  });

  return bodyChecks;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create a error if they user tries to update Password data
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'You cannot modify your password here. If you wish to update your password, proceed to: ..api/v1/users/updatemypassword',
        400
      )
    );
  // 2) Update the user document , persist to DB
  const update = filterObj(req.body, 'name', 'email');
  if (req.file) update.photo = req.file.filename;
  const updateUser = await User.findByIdAndUpdate(req.user._id, update, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    updateUser
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getAllUsers = handler.getAll(User);

exports.createUser = handler.createOne(User);

exports.getUser = handler.getOne(User);

exports.updateUser = handler.updateOne(User);

exports.deleteUser = handler.deleteOne(User);
