const request = require('request');
const createError = require('../http.error');
const API_URL = 'http://www.as' + 'os.' + 'de/api/product/catalogue/v2/products';
const log = require('../logger').getLogger('AsusCrawler');


class Crawler {
  constructor(url) {
    if (!url.includes('asos.')) {
      throw createError('SnackBar.Message.Error.NonStoreURL', 400);
    }
    const prodIdMatches = /\/prd\/(\d+)/.exec(url);
    if (prodIdMatches) {
      const prodId = prodIdMatches[1];
      this.url = `${API_URL}/${prodId}?store=de`;
    } else {
      throw createError('Could not find product id', 400);
    }
  }

  async init() {
    const body = await new Promise((resolve, reject) => {
      return request({uri: this.url}, (error, resp, body) => {
        if (error) {
          log.error('Could not request URL', this.url, error);
          if (error.message && error.message.includes('SnackBar.Message.Error.InvalidURL')) {
            throw createError('Invalid URL', 400);
          }
          return reject(error, resp);
        }
        return resolve(body)
      });
    });
    this.product = JSON.parse(body);
  }


  // Check for !this.product.isNoSize && !this.product.isOneSize
  getSizes() {
    const variants = this.product.variants;
    if (variants.length > 0) {
      return variants.map(v => ({id: v.sizeId, name: v.brandSize, isAvailable: v.isInStock, isLow: v.isLowInStock}));
    } else {
      return [{name: 'ONESIZE', id: 'ONESIZE', isAvailable: true}];
    }
  }

  isSizeAvailable(id) {
    return (this.getSizes().find(s => s.id == id) || {}).isAvailable;
  }

  isInCatalog() {
    return this.product && this.product.isInStock;
  }

  getPrice() {
    return this.product.price.current.value;
  }

  getName() {
    return this.product.name;
  }


}

module.exports = Crawler;