/*eslint-disable*/

import axios from 'axios';
import { showAlert } from './alerts.js';

export const bookTour = async tourId => {
  // Get checkout session from backend api
  try {
    const stripe = Stripe(
      'pk_test_51KAROnEcQBB3cSJY2HDrS3BbE4cK51FAGM7Ij1nYQ886u8xTmZriuhHzDWmacWA2h1sdPolSEqFckwhCVp8YqjV000oTLb9ndY'
    );
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', 'Error getting that request. Please try again.');
  }
  // create checkout form + charge credit card
};
