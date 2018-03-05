const Authenticator = require('../user/authenticator');
const UserController = require('../user/user.controller');
const log = require('../logger').getLogger('TelegramAuth');


module.exports.authSession = async (ctx, next) => {

    if (ctx.session.userId) {
      log.debug('found user in session', {userId: ctx.session.userId});
      return next(ctx);
    }

    const userId = await getUserFromDatabase();
    if (userId) {
      log.debug('found user in db', {userId: userId + ''});
      ctx.session.userId = userId;
      return next(ctx);
    }

    log.debug('No user found', {telegramId: ctx.from.id});
    if (ctx.message.text && !ctx.message.text.includes('/start')) {
      // TODO: Check URL
      ctx.reply('You need to link your shassi account first. Go to https://shassi.kimkern.de/auth/telegram');
    }
    // Do not call next() without account.

  async function getUserFromDatabase() {
    const telegramId = ctx.from.id;
    return await UserController.getByTelegramId(telegramId);
  }

};

/**
 * TODO: start with https://telegram.me/shassi_bot?start=/start ${token}
 */
module.exports.startCommand = async (ctx, next) => {
  log.debug('/start');
  const token = ctx.message.text.replace('/start ', '');
  const userId = Authenticator.checkToken(token, 'telegram');
  if (!userId) {
    ctx.reply('Given token was invalid. Try again');
  } else {
    UserController.setTelegramId(userId, ctx.from.id);
    ctx.session.userId = userId;
    ctx.reply(`Welcome! Your account was successfully connected.`);
    ctx.reply('You can add a product by sending its URL to this chat.');
  }
  return next(ctx);
};