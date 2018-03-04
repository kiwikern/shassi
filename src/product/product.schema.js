const mongoose = require('mongoose');

const productUpdateSchema = mongoose.Schema({
  price: Number,
  isAvailable: Boolean,
});

productUpdateSchema.virtual('createdAt').get(function () {
  return this._id.getTimestamp();
});

const removeId = (doc, ret, options) => {
  delete ret._id;
  if (ret.id) delete ret.id;
  return ret;
};

productUpdateSchema.set('toJSON', {virtuals: true, versionKey: false, transform: removeId});

const productSchema = mongoose.Schema({
  url: {type: String, required: true},
  name: String,
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

const getLatestUpdate = function (updates) {
  return updates.reduce((u1, u2) => u1._id > u2._id ? u1 : u2, {});
};

productSchema.virtual('price').get(function () {
  const latestUpdate = getLatestUpdate(this.updates);
  return latestUpdate ? latestUpdate.price : null;
});

productSchema.virtual('isAvailable').get(function () {
  const latestUpdate = getLatestUpdate(this.updates);
  return latestUpdate ? latestUpdate.isAvailable : null;
});

productSchema.virtual('createdAt').get(function () {
  return this._id.getTimestamp();
});

productSchema.virtual('store').get(function () {
  if (this.url.includes('hm.' + 'com')) {
    return 'H&M';
  } else {
    return '';
  }
});

productSchema.virtual('sizeName').get(function () {
  return this.size ? this.size.name : '';
});

const select = (doc, ret, options) => {
  delete ret.size;
  return ret;
};

productSchema.set('toJSON', {virtuals: true, versionKey: false, transform: select});


module.exports = productSchema;