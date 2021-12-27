/* eslint-disable */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import axios from 'axios';
import { showAlert } from './alerts.js';

export const updateUserSettings = async function (data, type) {
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updatemypassword'
        : 'http://127.0.0.1:3000/api/v1/users/updateme';
    const res = await axios({
      method: 'PATCH',
      url,
      data: data
    });

    if (res.data.status === 'success') {
      localStorage.clear();
      showAlert('success', 'Account Updated Successfully');
      window.setTimeout(() => {
        location.assign('/me');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
