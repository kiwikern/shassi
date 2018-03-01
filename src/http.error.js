const throwError = (msg = 'Internal Error', status = 500) => {
  const error = new Error(msg);
  error.status = status;
  error.expose = true;
  return error;
};

module.exports = throwError;