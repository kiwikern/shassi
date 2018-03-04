// const casper = require('casper').create();
const jsdom = require("jsdom");
const request = require('request');
const {JSDOM} = jsdom;
const log = require('../logger').getLogger('HM-Crawler');
const createError = require('../http.error');

class Crawler {
  constructor(url) {
    if (!url.includes('hm.')) {
      throw createError('SnackBar.Message.Error.NonStoreURL', 400);
    }
    if (url.includes('m.hm' + '.com')) {
      url = url.replace('m.hm' + '.com', 'www.hm' + '.com');
    }
    this.url = url;
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
    this.document = new JSDOM(body).window.document;
  }

  getSizes() {
    const options = this.document.getElementById('options-variants')
      .children;
    return Array.from(options)
      .map(child => ({
        id: child.id,
        name: child.children[0].children[0].innerHTML,
        isAvailable: !child.className.includes('soldOut')
      }));
  }

  isInCatalog() {
    return !this.document.getElementById('errorMessage')
  }

  isSizeAvailable(id) {
    return !this.document.getElementById(id).className.includes('soldOut');
  }

  getPrice() {
    const priceSpan = this.document.getElementById('text-price');
    const children = priceSpan.children;
    let priceText;
    if (children.length > 0) {
      priceText = children[0].innerHTML;
    }
    return parseFloat(priceText.replace(',', '.'));
  }

  getName() {
    return this.document.getElementsByTagName('h1')[0]
      .childNodes[0]
      .nodeValue
      .trim();
  }

  /**
   * Does not work because scripts are not loaded.
   */
  selectSize(id) {
    log.error('Should not be used.');
    const anchor = this.document.getElementById(id).children[0];
    anchor.click()
  }

  /**
   * Does not work because scripts are not loaded.
   */
  hasLowStock() {
    log.error('Should not be used.');
    return this.document.getElementById('text-stockLevelInfo').style.visibility === 'visible';
  }

}

module.exports = Crawler;