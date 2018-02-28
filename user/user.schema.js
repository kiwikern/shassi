const mongoose = require('mongoose');

  const userSchema = mongoose.Schema({
    username: String,
    password: String,
  });

module.exports = userSchema;