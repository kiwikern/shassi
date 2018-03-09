const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  username: {type: String, unique: true, required: true},
  email: String,
  password: {type: String, required: true},
  telegramId: {type: String, unique: true, sparse: true}
});

module.exports = userSchema;