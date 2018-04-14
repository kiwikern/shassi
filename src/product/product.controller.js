const Product = require('./product.model');
const log = require('../logger').getLogger('ProductController');
const createError = require('../http.error');
const Crawler = require('./product.crawler');
const CronJob = require('cron').CronJob;
const UpdatesSender = require('../notifications/updates.sender');

class ProductController {

  static async getAllProductsForUser(userId) {
    const products = await Product.find({userId})
      .sort({_id: -1});
    return products.map(p => p.toJSON())
  }

  static async addProduct(url, userId) {
    if (url.startsWith('www.')) {
      url = url.replace('www.', 'http://www.');
    }
    log.debug('create new product', {url, userId});
    const initializedProduct = await ProductController.initProduct(url, userId);
    initializedProduct._id = (await this.saveProduct(initializedProduct))._id;
    log.debug('saved new product', initializedProduct._id + '');
    return initializedProduct;
  }


  static async initProduct(url, userId) {
    const crawler = await Crawler.getCrawler(url);
    const product = {url, userId};
    if (await !crawler.isInCatalog()) {
      log.info('Product does not exist.');
      throw createError('Product does not exist.', 404);
    }
    try {
      product.sizes = await crawler.getSizes();
      product.name = await crawler.getName();
      product.price = await crawler.getPrice();
    } catch (error) {
      log.error('Could not crawl product', error);
      if (error.status) throw error;
      throw createError('Could not crawl product.', 400);
    }
    return product;
  }

  static async update(productId, size, name) {
    log.debug('update', {productId, size});
    const product = await ProductController.findById(productId);
    if (name) {
      await product.set({name});
    }
    if (size) {
      await product.set({size});
    }
    await product.save();
    await this.createUpdate(productId, true);
    return (await this.findById(productId)).toJSON();
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
      .sort({_id: 1})
      .select('_id');
    const updatesByUser = new Map();
    const updates = await Promise.all(ids.map(id => this.createUpdate(id)
      .catch(error => log.error('Could not update products.', {id}, error))));
    updates.map(update => {
      if (!update) {
        return;
      }
      const userId = update.product.userId.toString();
      if (!updatesByUser.has(userId)) {
        updatesByUser.set(userId, []);
      }
      updatesByUser.get(userId).push(update);
    });
    for (const [userId, updates] of updatesByUser) {
      UpdatesSender.notify(userId, updates);

    }
  }

  static async createUpdate(productId, preventUnread) {
    const product = await this.findById(productId);
    if (!product.isActive) {
      throw createError('Cannot create update for inactive product.', 400);
    }
    const latestUpdate = ProductController.findLatestUpdate(product) || {};
    const update = await ProductController.getNewUpdate(product);

    const hasPriceChanged = latestUpdate.price !== update.price;
    const hasAvailabilityChanged = latestUpdate.isAvailable !== update.isAvailable;
    if (update && (hasPriceChanged || hasAvailabilityChanged)) {
      log.debug('saving update', update);
      await product.update({$push: {updates: update}, $set: {hasUnreadUpdate: !preventUnread}});
      return {product, new: update, old: latestUpdate};
    } else {
      return null;
    }
  }

  static async getNewUpdate(product) {
    const crawler = await Crawler.getCrawler(product.url);

    if (!crawler.isInCatalog()) {
      log.debug('Product is not in catalog anymore.', product._id);
      product.isActive = false;
      product.save();
      return {price: product.price, isAvailable: false};
    }

    let update = {};
    update.price = await crawler.getPrice(product.size ? product.size.id : null);
    if (product.size && product.size.id) {
      update.isAvailable = await crawler.isSizeAvailable(product.size.id);
    }
    log.silly('found update', update);
    return update;
  }

  static findLatestUpdate(product) {
    const latestUpdate = product.get('updates').reduce((u1, u2) => u1._id > u2._id ? u1 : u2, {});
    log.silly('found latest Update', {price: latestUpdate.price, isAvailable: latestUpdate.isAvailable});
    return latestUpdate;
  }

  static async saveProduct(product) {
    const newProduct = new Product(product);
    try {
      return await newProduct.save();
    } catch (err) {
      log.error('Could not create product.', err);
      if (err.code === 11000) {
        const conflictingProduct = await Product.findOne({url: product.url, userId: product.userId});
        log.error('found conflict', conflictingProduct._id);
        const error = JSON.stringify({message: 'Product already exists.', _id: conflictingProduct._id});
        throw createError(error, 409);
      } else {
        throw createError();
      }
    }
  }

  static async deleteProduct(productId) {
    log.debug('delete product', {productId});
    const product = await this.findById(productId);
    await product.remove();
  }

  static startCronJob() {
    const job = new CronJob('00 00 8,14,18 * * *', () => this.updateAllProducts());
    job.start();
    log.info('Product CronJob started:', job.cronTime.source)
  }

  static async markRead(productId) {
      log.debug('Mark product read', productId);
    const product = await this.findById(productId);
    product.hasUnreadUpdate = false;
    await product.save();
  }

}

module.exports = ProductController;