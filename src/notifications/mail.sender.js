const nodemailer = require('nodemailer');
const mailSecrets = require('../secrets.js').mail;
const log = require('../logger').getLogger('MailSender');

const transporter = nodemailer.createTransport({
  host: mailSecrets.server,
  port: 587,
  secure: false,
  auth: {
    user: mailSecrets.user,
    pass: mailSecrets.password
  }
});

exports.sendMail = (mailOptions) => {
  log.debug('sending mail', mailOptions.to);
  mailOptions.from = `"Shassi" <${mailSecrets.user}>`;
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, error => {
      if (error) {
        log.error('could not send mail', error);
        reject(error);
      } else {
        resolve();
      }
    });
  });
};