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
  isActive: {type: Boolean, default: true},
  hasUnreadUpdate: {type: Boolean, default: false},
});

productSchema.index({url: 1, userId: 1}, {unique: true});

const getLatestUpdate = function (updates) {
  if (!updates) {
    return null;
  }
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

productSchema.virtual('updatedAt').get(function () {
  const latestUpdate = getLatestUpdate(this.updates);
  return latestUpdate ? latestUpdate._id.getTimestamp() : this._id.getTimestamp();
});

productSchema.virtual('store').get(function () {
  if (this.url.includes('hm.' + 'com')) {
    return 'H&M';
  } else if (this.url.includes('asos')) {
    return 'ASOS';
  } else if (this.url.includes('weekday.')) {
    return 'Weekday';
  } else if (this.url.includes('cos' + 'stores')) {
    return 'COS';
  } else if (this.url.includes('about' + 'you')) {
    return 'ABOUT YOU';
  } else if (this.url.includes('amazon')) {
    return 'Amazon';
  } else {
    console.warn('Could not find store for URL', this.url);
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