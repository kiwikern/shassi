const bcrypt = require('bcrypt');
const log = require('../logger').getLogger('PasswordEncrypter');
const throwError = require('../http.error');

class PasswordEncrypter {
  static async encryptPassword(password) {
    return await new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        if (!err) {
          return resolve(hash);
        } else {
          log.error('could not hash password', err);
          return reject(throwError('Could not hash password.'));
        }
      });
    });
  }

  static async checkPassword(password, storedPassword) {
    return await new Promise((resolve, reject) => {
      bcrypt.compare(password, storedPassword, (err, isValid) => {
        if (isValid) {
          return resolve();
        } else {
          log.debug('password incorrect.');
          return reject(throwError('wrong password'));
        }
      });
    });
  }
}

module.exports = PasswordEncrypter;