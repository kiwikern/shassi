const Telegraf = require('telegraf');
const session = require('telegraf/session');
const Markup = require('telegraf/markup');
const secrets = require('../../secrets').telegram;
const authSession = require('./telegram.auth').authSession;
const startCommand = require('./telegram.auth').startCommand;
const ProductController = require('../product/product.controller');
const log = require('../logger').getLogger('TelegramBot');

class Bot {
  constructor() {
    this.telegraf = new Telegraf(secrets.token);
    this.telegraf.use(session());
    this.telegraf.command('start', startCommand);
    this.telegraf.use(authSession);
    this.addURLs();
    this.handleErrors();
    this.updateProductOnSizeChosen();
    this.telegraf.startPolling();
    log.debug('init finished')
  }

  handleErrors() {
    this.telegraf.catch(err => {
      log.error('Got error', err);
    });
  }

  addURLs() {
    this.telegraf.hears(/^(?!\/).+/, async ctx => {
      try {
        const product = await ProductController.addProduct(ctx.message.text, ctx.session.userId);
        if (product.sizes && product.sizes.length > 1) {
          ctx.reply('Which size do you want?', this.createKeyboard(product.sizes, product._id));
        } else {
          await ProductController.createUpdate(product._id);
          const p = await ProductController.findById(product._id);
          ctx.reply(`Product ${p.name} for ${p.price}€ at store ${p.store} was added.`);
        }
      } catch (err) {
        log.info('Could not add product.', err);
        if (err.message.includes('already exists')) {
          ctx.reply('Product has already been added.');
        } else if (err.message.includes('Unknown store')) {
          ctx.reply('Invalid URL. Is store supported?');
        } else if (err.message.includes('does not exist')) {
          ctx.reply('Product does not exist. Check URL.')
        }else {
          ctx.reply('Internal error. Could not add product.');
        }
      }
    });
  }

  updateProductOnSizeChosen() {
    this.telegraf.action(/.+/, async ctx => {
      log.debug(ctx.match);
      const answer = ctx.match[0].split('|-|');
      const size = {name: answer[0], id: answer[1]};
      const productId = answer[2];
      ctx.answerCbQuery(`You chose ${size.name}.`);
      ctx.editMessageReplyMarkup({});
      const p = await ProductController.update(productId, size);
      ctx.reply(`Your product ${p.name} for ${p.price}€ at store ${p.store} with size ${size.name} was added successfully.`);
    });
  }

  createKeyboard(sizes, productId) {
    return Markup
      .inlineKeyboard(sizes.map(s => Markup.callbackButton(`${s.name}${s.isAvailable ? '' : ' (n/a)'}`, `${s.name}|-|${s.id}|-|${productId}`)))
      .oneTime()
      .resize()
      .extra();
  }
}

module.exports = Bot;