const mongoose = require('mongoose');

  const userSchema = mongoose.Schema({
    username: {type: String, unique: true},
    password: String,
  });

module.exports = userSchema;