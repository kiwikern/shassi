const Product = require('./product.model');
const log = require('../logger').getLogger('ProductController');
const createError = require('../http.error');
const Crawler = require('./product.crawler');
const CronJob = require('cron').CronJob;
const UpdatesSender = require('../notifications/updates.sender');

class ProductController {

  static async getAllProductsForUser(userId) {
    const products = await Product.find({userId})
      .sort({_id: 1});
    return products.map(p => p.toJSON())
  }

  static async addProduct(product) {
    log.debug('create new product', {product});
    const initializedProduct = await ProductController.initProduct(product);
    initializedProduct._id = (await this.saveProduct(initializedProduct))._id;
    log.debug('saved new product', initializedProduct._id);
    return initializedProduct;
  }


  static async initProduct(product) {
    const crawler = await Crawler.getCrawler(product);
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

  static async update(productId, sizeId, sizeName, name) {
    log.debug('update', {productId, sizeId, sizeName});
    const product = await ProductController.findById(productId);
    await product.set({size: {name: sizeName, id: sizeId}, name});
    await product.save();
    await this.createUpdate(productId);
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
      .sort({_id:1})
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
      UpdatesSender.sendUpdatesMail(userId, updates)
        .catch(error => log.error('Could not send mail.', {
          userId: userId.toString(),
          updatesSize: updates.length
        }, error));

    }
  }

  static async createUpdate(productId) {
    try {
      const product = await this.findById(productId);
      const latestUpdate = ProductController.findLatestUpdate(product);
      const update = await ProductController.getNewUpdate(product);

      if (!latestUpdate || latestUpdate.price !== update.price || latestUpdate.isAvailable !== update.isAvailable) {
        log.debug('saving update', update);
        await product.update({$push: {updates: update}});
        return {product, new: update, old: latestUpdate};
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
    if (product.size && product.size.id) {
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