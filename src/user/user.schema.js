const mongoose = require('mongoose');

  const userSchema = mongoose.Schema({
    username: {type: String, unique: true},
    email: String,
    password: String,
  });

module.exports = userSchema;