const jwt = require('jsonwebtoken');
const jwtConfig = require('../secrets.js').jwt;
const PasswordEncrypter = require('./password.encrypter');
const log = require('../logger').getLogger('Authenticator');
const throwError = require('../http.error');

class Authenticator {

  static async login(password, storedPassword) {
    if (!password) {
      log.debug('missing password.');
      throw throwError('You need to provide a password.', 400);
    }

    try {
      await PasswordEncrypter.checkPassword(password, storedPassword)
    } catch (err) {
      log.debug('wrong password.');
      throw throwError('The entered password was not correct.', 401);
    }

    try {
      const jwtOptions = {algorithm: 'HS256', expiresIn: `30d`};
      log.debug('token expires in', jwtOptions.expiresIn);
      return {jwt: jwt.sign({}, jwtConfig.secret, jwtOptions)};
    } catch (error) {
      log.error('could not generate token', error);
      throw throwError('Could not generate token.');
    }
  }
}

module.exports = Authenticator;