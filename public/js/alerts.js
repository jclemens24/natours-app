/* eslint-disable */

export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

export const showAlert = (type, msg, time = 5) => {
  hideAlert();
  const html = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', html);
  window.setTimeout(hideAlert, time * 1000);
};
