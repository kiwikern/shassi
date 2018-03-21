const log = require('../logger').getLogger('Cos-Crawler');
const createError = require('../http.error');
const axios = require('axios');
const jsdom = require("jsdom");
const {JSDOM} = jsdom;

class Crawler {
  constructor(url) {
    if (!url.includes('cos' + 'stores')) {
      throw createError('SnackBar.Message.Error.NonStoreURL', 400);
    }
    if (url.startsWith('www.')) {
      url = url.replace('www.', 'http://www.');
    }
    this.url = url;
  }

  async init() {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Cookie': 'HMCORP_locale=de_DE;HMCORP_currency=EUR;',
    };
    this.body = (await axios.get(this.url, {headers})).data;

    this.document = new JSDOM(this.body).window.document;

    const sizeInput = this.document.querySelector('.productSizes input');
    if (sizeInput && sizeInput.value) {
      this.articleId = sizeInput.value;
    } else {
        this.articleId = /(?!\/)\d+-(\d+)[^\/]*$/.exec(this.url)[1];
    }
    try {
      this.colorId = /#(?:c-)?(\d+)$/.exec(this.url)[1];
    } catch (e) {
      log.warn('Could not get color id');
    }


    const apiUrl = 'https://www.cosstores.com/de/product/GetVariantData?variantId=' + this.articleId;
    this.article = (await axios.get(apiUrl, {headers})).data;
  }

  getSizes() {
    const labels = this.document.querySelectorAll('.productSizes > label');
    const sizes = [];
    for (const label of labels) {
      const name = label.textContent;
      const id = label.attributes.for.value;
      const isAvailable = !label.attributes.class.value.includes('outOfStock');
      let hasChosenColor = true;
      try {
        const colorId = label.children[0].attributes.getNamedItem('data-colorid').value;
        hasChosenColor = !colorId || !this.colorId || colorId === this.colorId;
      } catch (e) {
        log.warn('Could not detect chosen color.', e);
        hasChosenColor = true;
      }
      if (hasChosenColor) {
        sizes.push({name, id, isAvailable});
      }
    }
    return sizes;
  }

  isInCatalog() {
    // TODO: /Archive/ in redirected URL?
    return true;
  }

  isSizeAvailable(id) {
    return this.getSizes().find(s => s.id === id).isAvailable;
  }

  getPrice() {
    return this.article.Price;
  }

  getName() {
    return this.article.Name.trim();
  }

}

module.exports = Crawler;