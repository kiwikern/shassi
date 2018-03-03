const Telegraf = require('telegraf');
const session = require('telegraf/session');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const secrets = require('../../secrets').telegram;
const log = require('../logger').getLogger('TelegramBot');

class Bot {
  constructor() {
    this.telegraf = new Telegraf(secrets.token);
    this.telegraf.use(session());
    this.onNewUser();
    this.handleErrors();
    this.telegraf.startPolling();
    log.debug('init finished')
  }

  handleErrors() {
    this.telegraf.catch(err => {
      log.error('Got error', err);
    });
  }

  async onNewUser() {
    this.telegraf.hears('hi', ctx => {
      ctx.reply('Test', this.createKeyboard(['hi', 'hu']));
    });

    this.telegraf.command('register', ctx => {
      log.debug('got message', ctx.message);
      ctx.reply('Test', this.createKeyboard());
    });

    this.telegraf.use((ctx, next) => {
      const userId = ctx.from.id;
      // Check if user exists?
      // Check if session is built
      console.log(ctx.session);
      if (!ctx.session.users) {
        // Check database for user?
        ctx.session.users = [userId];
      } else if (!ctx.session.users.includes(userId)) {
        ctx.session.users.push(userId);
      }
      return next();
    })
  }

  createKeyboard(options) {
    return Markup
      .keyboard(options)
      .oneTime()
      .resize()
      .extra();
  }
}

module.exports = Bot;