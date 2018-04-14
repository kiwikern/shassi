const MailSender = require('./mail.sender');
const UpdatesFormatter = require('./updates.formatter');
const UserController = require('../user/user.controller');
const log = require('../logger').getLogger('UpdatesSender');
let Bot;
// Load asynchronously: Otherwise ProductController is not initialized.
setTimeout(() => Bot = require('../telegram/telegram.bot'));

class UpdatesSender {

  static async notify(userId, updates) {
    const notificationTypes = await UserController.getNotificationTypes(userId);

    if (notificationTypes.email) {
      this.sendUpdatesMail(userId, updates)
        .catch(error => log.error('Could not send mail.', {
          userId: userId.toString(),
          updatesSize: updates.length
        }, error));
    }

    if (notificationTypes.telegram) {
      this.sendTelegramNotifications(userId, updates)
        .catch(error => log.error('Could not send telegram notifications.', {
          userId: userId.toString(),
          updatesSize: updates.length
        }, error));
    }
  }

  static async sendUpdatesMail(recipientId, updates) {
    log.debug('sendUpdateMail', {userId: recipientId.toString(), size: updates.length});
    const email = await UserController.getUserMail(recipientId);
    if (!email) {
      log.info('Did not send mail notification, missing address', recipientId);
      return;
    }
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
    log.debug('Sending Telegram notifications', {userId: userId.toString(), size: updates.length});
    const promises = [];
    for (const update of updates) {
      promises.push(Bot.notifyAboutUpdate(update.product));
    }
    return Promise.all(promises);
  }
}

module.exports = UpdatesSender;