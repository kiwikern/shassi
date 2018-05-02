const HmCrawler = require('./hm.crawler');
const AmazonCrawler = require('./amazon.crawler');
const AsosCrawler = require('./asos.crawler');
const AboutYouCrawler = require('./aboutyou.crawler');
const WeekdayCrawler = require('./weekday.crawler');
const CosCrawler = require('./cos.crawler');
const log = require('../logger').getLogger('ProductCrawler');
const createError = require('../http.error');

class Crawler {
  static async getCrawler(url) {
    let crawler;
    if (url.includes('hm.' + 'com')) {
      crawler = new HmCrawler(url);
    } else if (url.includes('asos.')) {
      crawler = new AsosCrawler(url);
    } else if (url.includes('weekday.')) {
      crawler = new WeekdayCrawler(url);
    } else if (url.includes('cos' + 'stores.')) {
      crawler = new CosCrawler(url);
    } else if (url.includes('about' + 'you.de')) {
      crawler = new AboutYouCrawler(url);
    } else if (url.includes('amazon' + '.de')) {
      crawler = new AmazonCrawler(url);
    } else {
      log.error('No crawler found for given url.', {url});
      throw createError('Unknown store', 400);
    }
    await crawler.init();
    return crawler;
  }

}

module.exports = Crawler;