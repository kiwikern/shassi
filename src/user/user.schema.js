const mongoose = require('mongoose');

  const userSchema = mongoose.Schema({
    username: {type: String, unique: true},
    email: String,
    password: String,
    telegramId: {type: String, unique: true, sparse: true}
  });

module.exports = userSchema;