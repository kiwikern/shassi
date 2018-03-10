const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  username: {type: String, unique: true, required: true},
  email: String,
  password: {type: String, required: true},
  telegramId: {type: String, unique: true, sparse: true},
  notificationTypes: {
    telegram: {type: Boolean, default: true},
    email: {type: Boolean, default: true}
  }
});

const removePassword = (doc, ret, options) => {
  delete ret.password;
  return ret;
};

userSchema.set('toJSON', {virtuals: true, versionKey: false, transform: removePassword});

module.exports = userSchema;