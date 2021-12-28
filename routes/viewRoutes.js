const express = require('express');
const viewController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/', authController.isLoggedIn, viewController.getOverview);
router.get('/signup', viewController.getSignUpForm);
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/me', authController.verifyAuth, viewController.getAccount);
router.get('/my-tours', authController.verifyAuth, viewController.getMyTours);
router.post(
  '/submit-user-data',
  authController.verifyAuth,
  viewController.updateUserData
);

module.exports = router;
