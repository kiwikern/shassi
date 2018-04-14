const log = require('../logger').getLogger('AboutYou-Crawler');
const createError = require('../http.error');
const axios = require('axios');
const jsdom = require("jsdom");
const {JSDOM} = jsdom;

class Crawler {
  constructor(url) {
    if (!url.includes('about' + 'you.de')) {
      throw createError('SnackBar.Message.Error.NonStoreURL', 400);
    }
    this.url = url;
  }

  async init() {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Cookie': 'HMCORP_locale=de_DE;HMCORP_currency=EUR;',
    };
    this.body = (await axios.get(this.url, {headers})).data;
    this.article = JSON.parse(/window\.__INITIAL_STATE__=([^;]*?);/
      .exec(this.body)[1])
      .adpPage.product;

    this.document = new JSDOM(this.body).window.document;
  }

  getSizes() {
    return this.article.sizes
      .map(s => ({name: s.shopSize, id: s.variantId, isAvailable: !s.isDisabled}));
  }

  isInCatalog() {
    // TODO
    return true;
  }

  isSizeAvailable(id) {
    return this.getSizes().find(s => s.id === id).isAvailable;
  }

  getPrice(id) {
    if (!id) {
      return this.article.data.price.min / 100;
    }
    debugger;
    return this.article.variants
      .find(v => v.id === id).price.current / 100;
  }

  getName() {
    return this.article.data.name.trim();
  }

}

module.exports = Crawler;