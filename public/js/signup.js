/* eslint-disable */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { showAlert } from './alerts.js';
import axios from 'axios';

export const signup = async function (name, email, password, passwordConfirm) {
  try {
    const res = await axios({
      method: 'POST',
      url: `/api/v1/users/signup`,
      data: {
        name,
        email,
        password,
        passwordConfirm
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Account Created Successfully');
      location.assign('/');
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
