const mongoose = require('mongoose');

const telegramTokenSchema = mongoose.Schema({
  token: String,
  userId: {type: String, unique: true},
  createdAt: {type: Date, expires: '5m', default: Date.now}
});

const TelegramToken = mongoose.model('TelegramToken', telegramTokenSchema);


module.exports = TelegramToken;