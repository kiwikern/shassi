const jsdom = require('jsdom');
const request = require('request');
const {JSDOM} = jsdom;
const log = require('../logger').getLogger('Amazon-Crawler');
const createError = require('../http.error');

class Crawler {
  constructor(url) {
    if (!url.includes('amazon.')) {
      throw createError('SnackBar.Message.Error.NonStoreURL', 400);
    }
    this.url = url;
  }

  async init() {
    const body = await new Promise((resolve, reject) => {
      return request({uri: this.url}, (error, resp, body) => {
        if (error) {
          log.error('Could not request URL', this.url, error);
          if (error.message && error.message.includes('Invalid URI')) {
            throw createError('SnackBar.Message.Error.InvalidURL', 400);
          }
          return reject(error, resp);
        }
        return resolve(body)
      });
    });
    const virtualConsole = new jsdom.VirtualConsole();
    virtualConsole.on('jsdomError', () => log.info('JSDOM error'));
    this.document = new JSDOM(body, {virtualConsole}).window.document;
  }

  getSizes() {
    return [{id: 'ONESIZE', name: 'ONESIZE', isAvailable: true}];
  }

  isInCatalog() {
    const availabilityDiv = this.document.getElementById('availability');
    return !availabilityDiv || !availabilityDiv.innerHTML.includes('Derzeit nicht verfügbar');
  }

  isSizeAvailable(id) {
    return true;
  }

  getPrice() {
    const kindlePrice = this.document.getElementsByClassName('kindle-price');
    if (kindlePrice && kindlePrice[0]) {
      const price = this.formatPrice(kindlePrice[0].innerHTML);
      if (price) return price;
    }

    const salePrice = this.document.getElementById('priceblock_saleprice');
    if (salePrice) {
      const price = this.formatPrice(salePrice.innerHTML);
      if (price) return price;
    }

    const regularPrice = this.document.getElementById('priceblock_ourprice');
    if (regularPrice) {
      const price = this.formatPrice(regularPrice.innerHTML);
      if (price) return price;
    }

    log.error('Could not find price for product', this.url);
    throw createError('Could not find price.');
  }

  formatPrice(text) {
    const matches = /EUR (\d+,\d+)/.exec(text);
    if (matches && matches[1]) {
      return matches[1].replace(',', '.');
    }
  }

  getName() {
    const ebookTitle = this.document.getElementById('ebooksProductTitle');
    if (ebookTitle) {
      return ebookTitle.innerHTML.trim()
    }

    return this.document.getElementById('productTitle')
      .innerHTML
      .trim();
  }

}

module.exports = Crawler;