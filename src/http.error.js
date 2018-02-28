const throwError = (msg, status = 500) => {
  const error = new Error(msg);
  error.status = status;
  error.expose = true;
  return error;
};

module.exports = throwError;