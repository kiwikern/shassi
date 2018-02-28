const User = require('./user.model');
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
    const storedPassword = await this._getPassword(username);
    return await Authenticator.login(password, storedPassword);
  }

  static async _getPassword(username) {
    if (!username) {
      throw createError('No username given', 400);
    }
    const user = await User.findOne({username})
      .select('password');
    if (!user) {
      throw createError('Could not find user ' + username, 404);
    }
    return user.password;
  }

}

module.exports = UserController;