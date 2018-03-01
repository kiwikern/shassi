const mongoose = require('mongoose');

  const productUpdateSchema = mongoose.Schema({
    price: Number,
    isAvailable: Boolean,
  });

  const productSchema = mongoose.Schema({
    url: {type: String, required: true},
    name: String,
    store: {type: String, required: true, enum: ['hm']},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    size: {
      id: String,
      name: String
    },
    updates: [productUpdateSchema],
    isActive: {type: Boolean, default: true}
  });

  productSchema.index({url: 1, userId: 1}, {unique: true});
  productSchema.statics.getStores = () => productSchema.path('store').enumValues;

module.exports = productSchema;