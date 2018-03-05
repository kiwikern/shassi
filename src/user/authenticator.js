const jwt = require('jsonwebtoken');
const jwtMiddleware = require('koa-jwt');
const jwtConfig = require('../../secrets.js').jwt;
const PasswordEncrypter = require('./password.encrypter');
const log = require('../logger').getLogger('Authenticator');
const throwError = require('../http.error');

class Authenticator {

  static getAuthMiddleware() {
    return jwtMiddleware({secret: jwtConfig.secret});
  }

  static async login(userId, password, storedPassword) {
    if (!password) {
      log.debug('missing password.');
      throw throwError('You need to provide a password.', 400);
    }
    await PasswordEncrypter.checkPassword(password, storedPassword);
    return this.generateToken(userId, 'user')
  }

  static generateTelegramToken(userId) {
    return this.generateToken(userId, 'telegram', '1h')
  }

  static generateToken(userId, role, expiresIn = '30d') {
    try {
      const jwtOptions = {algorithm: 'HS256', expiresIn};
      log.debug('token expires in', jwtOptions.expiresIn);
      return {jwt: jwt.sign({userId, role}, jwtConfig.secret, jwtOptions)};
    } catch (error) {
      log.error('could not generate token', error);
      throw throwError('Could not generate token.');
    }
  }

  static checkToken(token, role) {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret);
      if (decoded.role === role) {
        return decoded.userId
      } else {
        log.warn('Got jwt for invalid role', {decoded});
        return null;
      }
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        log.warn('Token is expired', {expiredAt: err.expiredAt})
      }
      log.warn('Got invalid jwt', {token});
      return null;
    }
  }
}

module.exports = Authenticator;