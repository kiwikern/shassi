const HmCrawler = require('./hm.crawler');
const log = require('../logger').getLogger('ProductCrawler');
const createError = require('../http.error');

class Crawler {
  static async getCrawler(product) {
    let crawler;
    if (product.store === 'hm') {
      crawler = new HmCrawler(product.url);
    } else {
      log.error('No crawler found for given store.', {store: product.store, id: product._id});
      throw createError('Unknown store', 400);
    }
    await crawler.init();
    return crawler;
  }

}

module.exports = Crawler;