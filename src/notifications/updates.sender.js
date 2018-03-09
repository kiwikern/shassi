const MailSender = require('./mail.sender');
const UpdatesFormatter = require('./updates.formatter');
const UserController = require('../user/user.controller');
const Bot = require('../telegram/telegram.bot');
const log = require('../logger').getLogger('UpdatesSender');

class UpdatesSender {

  static async notify(userId, updates) {
    this.sendUpdatesMail(userId, updates)
      .catch(error => log.error('Could not send mail.', {
        userId: userId.toString(),
        updatesSize: updates.length
      }, error));

    this.sendTelegramNotifications(userId, updates)
      .catch(error => log.error('Could not send telegram notifications.', {
        userId: userId.toString(),
        updatesSize: updates.length
      }, error));
  }

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

  static async sendTelegramNotifications(userId, updates) {
    const promises = [];
    for (const update of updates) {
      promises.push(Bot.notifyAboutUpdate(update.product));
    }
    return Promise.all(promises);
  }
}

module.exports = UpdatesSender;