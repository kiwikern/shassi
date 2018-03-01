const mongoose = require('mongoose');

  const productSchema = mongoose.Schema({
    url: {type: String, unique: true, required: true},
    store: {type: String, required: true},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}
  });

module.exports = productSchema;