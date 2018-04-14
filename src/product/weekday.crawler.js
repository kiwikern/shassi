const log = require('../logger').getLogger('Weekday-Crawler');
const createError = require('../http.error');
const axios = require('axios');

class Crawler {
  constructor(url) {
    if (!url.includes('week' + 'day')) {
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
    this.articleId = /(\d+)\.html/.exec(this.url)[1];
    const productArticleDetails = /var productArticleDetails = {[^]*?(?=<\/script>)/.exec(this.body)[0];
    const articleJson = productArticleDetails.replace(/\s/g, '')
      .replace(/'/g, '"')
      .replace('varproductArticleDetails=', '')
      .replace(/",]/g, '"]')
      .replace(/},]/g, '}]')
      .replace(/],}/g, ']}')
      .replace(/",}/g, '"}')
      .replace(/"\/"/g, '')
      .slice(0, -1);
    this.articles = JSON.parse(articleJson);
    this.article = this.articles[this.articleId];
  }

  async getSizes() {
    const variants = this.article.variants;
    const availableSizeIds = await this.getAvailableSizeIds(variants.map(v => v.variantCode));
    const sizes = variants.map(v => ({
      name: v.sizeName,
      id: v.variantCode,
      isAvailable: availableSizeIds.includes(v.variantCode)
    }));
    return sizes;
  }

  async getAvailableSizeIds(variantIds) {
    const url = 'https://www.weekday.com/en_eur/getAvailability?variants=' + variantIds.join();
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Cookie': 'HMCORP_locale=de_DE;HMCORP_currency=EUR;'
    };
    return (await axios.get(url, {headers})).data;
  }

  isInCatalog() {
    // TODO: request returns 302?
    return true;
  }

  async isSizeAvailable(id) {
    const availableSizeIds = await this.getAvailableSizeIds([id]);
    return availableSizeIds.includes(id);
  }

  getPrice() {
    return parseFloat(this.article.priceSaleValue || this.article.priceValue);
  }

  getName() {
    return this.article.title
  }

}

module.exports = Crawler;