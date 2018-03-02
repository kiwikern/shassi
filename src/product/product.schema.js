const mongoose = require('mongoose');

const productUpdateSchema = mongoose.Schema({
  price: Number,
  isAvailable: Boolean,
});

productUpdateSchema.virtual('createdAt').get(function () {
  return this._id.getTimestamp();
});

productUpdateSchema.set('toJSON', { virtuals: true });

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

productSchema.virtual('latestUpdate').get(function () {
  return this.updates.reduce((u1, u2) => u1._id > u2._id ? u1 : u2, {});
});

productSchema.virtual('createdAt').get(function () {
  return this._id.getTimestamp();
});

productSchema.set('toJSON', { virtuals: true });


module.exports = productSchema;