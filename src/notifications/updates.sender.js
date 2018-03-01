const MailSender = require('./mail.sender');
const UpdatesFormatter = require('./updates.formatter');
const UserController = require('../user/user.controller');
const log = require('../logger').getLogger('UpdatesSender');

class UpdatesSender {

  static async sendUpdatesMail(recipientId, updates) {
    log.debug('sendUpdateMail', {userId: recipientId.toString(), size: updates.length});
    const email = await UserController.getUserMail(recipientId);
    const mailText = UpdatesFormatter.format(updates);
    const mailOptions = {
      to: email,
      subject: 'New Product Updates',
      text: mailText,
      html: mailText
    };
    MailSender.sendMail(mailOptions);
  }
}

module.exports = UpdatesSender;