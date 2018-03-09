const log = require('../logger').getLogger('Weekday-Crawler');
const createError = require('../http.error');
const axios = require('axios');

class Crawler {
  constructor(url) {
    if (!url.includes('week' + 'day')) {
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
    // this.body = await new Promise((resolve, reject) => {
    //   return request({uri: this.url, headers}, (error, resp, body) => {
    //     if (error) {
    //       log.error('Could not request URL', this.url, error);
    //       if (error.message && error.message.includes('Invalid URI')) {
    //         throw createError('SnackBar.Message.Error.InvalidURL', 400);
    //       }
    //       return reject(error, resp);
    //     }
    //     return resolve(body)
    //   });
    // });
  }

  async getSizes() {
    // const variantsstring = /'variants' : \[[^\]]*\]/.exec(this.body)[0]
    //   .replace(/'/g, '"')
    //   .replace(/\s/g, '')
    //   .replace(/,}/g, '}')
    //   .replace(/,]/g, ']')
    //   .replace('"variants" :', '');
    //
    // const variants = JSON.parse(`{${variantsString}}`).variants;
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
    const availableVariants = (await axios.get(url, {headers})).data;
    // const availableVariants = await new Promise((resolve, reject) => {
    //   return request({uri: url, headers, json: true}, (error, resp, body) => {
    //     if (error) {
    //       log.error('Could not request URL', url, error);
    //       if (error.message && error.message.includes('Invalid URI')) {
    //         throw createError('SnackBar.Message.Error.InvalidURL', 400);
    //       }
    //       return reject(error, resp);
    //     }
    //     return resolve(body)
    //   });
    // });
    return availableVariants;
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
    // const priceSaleValue = (/'priceSaleValue': '([\d\.]+)'/.exec(this.body) || [])[1];
    // const priceValue = (/'priceValue': '([\d\.]+)'/.exec(this.body) || [])[1];
    // return parseFloat(priceSaleValue || priceValue);
    return parseFloat(this.article.priceSaleValue || this.article.priceValue);
  }

  getName() {
    // return /'title': '([^']+)'/.exec(this.body)[1]
    return this.article.title
  }

}

module.exports = Crawler;