/* eslint-disable */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import axios from 'axios';
import { showAlert } from './alerts.js';

export const updateUserSettings = async function (data, type) {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updatemypassword'
        : '/api/v1/users/updateme';
    const res = await axios({
      method: 'PATCH',
      url,
      data: data
    });

    if (res.data.status === 'success') {
      localStorage.clear();
      showAlert('success', 'Account Updated Successfully');
      location.assign('/me');
    }
  } catch (err) {
    showAlert('error', err.res.data.message);
  }
};
