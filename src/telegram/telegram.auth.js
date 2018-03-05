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
      ctx.reply('You need to link your shassi account first. Go to https://shassi.kimkern.de?action=createTelegramToken');
    }
    // Do not call next() without account.

  async function getUserFromDatabase() {
    const telegramId = ctx.from.id;
    return await UserController.getByTelegramId(telegramId);
  }

};

module.exports.startCommand = async (ctx, next) => {
  log.debug('/start');
  const message = ctx.message.text.replace('/start ', '');
  const params = message.split('---');
  const userId = params[0];
  const token = params.length > 1 ? params[1] : null;
  const isValid = await UserController.checkTelegramAuthToken(userId, token);
  if (!isValid) {
    ctx.reply('Given token was invalid. Try again');
  } else {
    try {
      await UserController.setTelegramId(userId, ctx.from.id);
      ctx.session.userId = userId;
      ctx.reply(`Welcome! Your account was successfully connected.`);
      ctx.reply('You can add a product by sending its URL to this chat.');
    } catch (err) {
      ctx.reply(`Could not connect Telegram account. Already linked to different shassi user account.`);
    }
  }
  return next(ctx);
};