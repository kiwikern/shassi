const User = require('./user.model');
const TelegramToken = require('./telegram-token.model');
const Authenticator = require('./authenticator');
const PasswordEncrypter = require('./password.encrypter');
const log = require('../logger').getLogger('UserController');
const createError = require('../http.error');

class UserController {

  static async createUser(username, plainPassword) {
    log.debug('create new user', {username});
    const password = await PasswordEncrypter.encryptPassword(plainPassword);
    const newUser = new User({username, password});
    return await newUser.save();
  }

  static async login(username, password) {
    log.debug('login', {username});
    const user = await this.getUserByName(username);
    return await Authenticator.login(user._id, password, user.password);
  }

  static async getUserByName(username) {
    if (!username) {
      throw createError('No username given', 400);
    }
    const user = await User.findOne({username});
    if (!user) {
      throw createError('Could not find user ' + username, 404);
    }
    return user;
  }

  static async createTelegramAuthToken(userId) {
    const dbToken = await TelegramToken.findOne({userId});
    let token;
    if (dbToken) {
      dbToken.set({createdAt: Date.now()});
      dbToken.save();
      token = dbToken.token;
    } else {
      token = Math.random().toString(36).substring(2);
      await (new TelegramToken({token, userId})).save()
    }
    return `${userId}---${token}`;
  }

  static async checkTelegramAuthToken(userId, token) {
    log.debug('checking Telegram Token', {userId, token});
    if (!userId || !token) {
      return false;
    }
    const dbToken = await TelegramToken.findOne({userId});
    return (dbToken || {}).token === token;
  }

  static async getUserMail(userId) {
    const user = await User.findById(userId);
    return user.email;
  }

  static async setTelegramId(userId, telegramId) {
    const user = await User.findById(userId);
    try {
      user.telegramId = telegramId;
      await user.save();
    } catch (err) {
      if (err.code === 11000) {
        throw createError('Telegram client already linked to other user.', 400);
      } else {
        log.error('Could not set TelegramId', err + '');
        throw err;
      }
    }
  }

  static async getByTelegramId(telegramId) {
    const user = await User.findOne({telegramId});
    return user ? user._id : null;
  }

}

module.exports = UserController;