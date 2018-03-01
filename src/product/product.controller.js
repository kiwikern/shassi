const Product = require('./product.model');
const log = require('../logger').getLogger('ProductController');
const createError = require('../http.error');

class ProductController {

  static async getAllProductsForUser(userId) {
    return await Product.find({userId});
  }

  static async createProduct(product) {
    log.debug('create new product', {product});
    const newProduct = new Product(product);
    try {
      return await newProduct.save();
    } catch (err) {
      log.error('Could not create product.', err);
      if (err.code === 11000) {
        throw createError('Product already exists.', 409);
      } else {
        throw createError();
      }
    }
  }

  static async deleteProduct(productId) {
    log.debug('delete product', {productId});
    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404);
    }
    await product.remove();
  }

}

module.exports = ProductController;