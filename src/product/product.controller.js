const Product = require('./product.model');
const log = require('../logger').getLogger('ProductController');
const createError = require('../http.error');
const Crawler = require('./product.crawler');
const CronJob = require('cron').CronJob;

class ProductController {

  static async getAllProductsForUser(userId) {
    return await Product.find({userId});
  }

  static async addProduct(product) {
    log.debug('create new product', {product});
    const sizes = await ProductController.getSizes(product);
    await this.saveProduct(product);
    return sizes;
  }


  static async getSizes(product) {
    const crawler = await Crawler.getCrawler(product);
    let sizes;
    try {
      sizes = await crawler.getSizes()
    } catch (error) {
      log.error('Could not crawl product', error);
      if (error.status) throw error;
      throw createError('Could not crawl product.', 400);
    }
    return sizes;
  }

  static async setSize(productId, sizeId, sizeName) {
    log.debug('setSize', {productId, sizeId, sizeName});
    const product = await ProductController.findById(productId);
    await product.set({size: {name: sizeName, id: sizeId}});
    return product;
  }

  static async findById(productId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404);
    }
    return product;
  }

  static async updateAllProducts() {
    log.info('Updating all products.');
    const ids = await Product.find({isActive: true})
      .select('_id');
    const updates = await Promise.all(ids.map(id => this.createUpdate(id)
      .catch(error => log.error('Could not update all products.', error))));
  }

  static async createUpdate(productId) {
    try {
      const product = await this.findById(productId);
      const latestUpdate = ProductController.findLatestUpdate(product);
      const update = await ProductController.getNewUpdate(product);

      if (!latestUpdate || latestUpdate.price !== update.price || latestUpdate.isAvailable !== update.isAvailable) {
        log.debug('saving update', update);
        await product.update({$push: {updates: update}});
        return {product, update};
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  static async getNewUpdate(product) {
    const crawler = await Crawler.getCrawler(product);
    let update = {};
    update.price = await crawler.getPrice();
    if (product.size) {
      update.isAvailable = await crawler.isSizeAvailable(product.size.id);
    }
    log.debug('found update', update);
    return update;
  }

  static findLatestUpdate(product) {
    const latestUpdate = product.get('updates').reduce((u1, u2) => u1._id > u2._id ? u1 : u2, {});
    log.debug('found latest Update', {price: latestUpdate.price, isAvailable: latestUpdate.isAvailable});
    return latestUpdate;
  }

  static async saveProduct(product) {
    const newProduct = new Product(product);
    try {
      await newProduct.save();
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

  static startCronJob() {
    const job = new CronJob('00 00 8,14,18 * * *', () => this.updateAllProducts());
    job.start();
    log.info('Product CronJob started:', job.cronTime.source)
  }

}

module.exports = ProductController;