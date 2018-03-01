const mongoose = require('mongoose');
const productSchema = require('./product.schema');

const Product = mongoose.model('Product', productSchema);

module.exports = Product;