const HmCrawler = require('./hm.crawler');
const log = require('../logger').getLogger('ProductCrawler');
const createError = require('../http.error');

class Crawler {
  static async getCrawler(url) {
    let crawler;
    if (url.includes('hm.' + 'com')) {
      crawler = new HmCrawler(url);
    } else {
      log.error('No crawler found for given url.', {url});
      throw createError('Unknown store', 400);
    }
    await crawler.init();
    return crawler;
  }

}

module.exports = Crawler;