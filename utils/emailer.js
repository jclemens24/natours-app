const pug = require('pug');
const { htmlToText } = require('html-to-text');
const sgMail = require('@sendgrid/mail');

class Email {
  constructor(user, host) {
    this.to = user.email;
    this.host = host;
    this.firstName = user.name.split(' ')[0];
    this.from = `Jordan Clemens <${process.env.EMAIL_FROM}>`;
  }

  async sendEmail(template, subject) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const view = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      host: this.host,
      subject
    });
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      view,
      text: htmlToText(view)
    };

    await sgMail.send(mailOptions);
  }

  async sendWelcome() {
    await this.sendEmail('welcome', 'Welcome to Natours, trailblazer!');
  }

  async sendPasswordReset() {
    await this.sendEmail('passwordReset', 'Password Reset Token [Natours]');
  }
}

module.exports = { Email };
