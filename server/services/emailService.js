const nodemailer = require('nodemailer');
const { createEmail, getEmailCountByIp, getEmailCountByEmail, getTotalEmailCountToday } = require('../models/emailModel');
const logger = require('../logger'); // 引入日志记录器

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'weixingchensimon@gmail.com',
    pass: 'your-pass-here',
  },
});

const sendSmtpUsageAlert = async (email) => {
  const mailOptions = {
    from: 'weixingchensimon@gmail.com',
    to: email,
    subject: 'SMTP Usage Alert - Focal System for Dr. Steve Hranilovic',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #4CAF50;">SMTP Usage Alert</h2>
        <p>Dear user,</p>
        <p>We noticed that your email account was used to send emails via our SMTP service. If you did not authorize this action, please take immediate steps to secure your account.</p>
        <p>Here are a few things you can do:</p>
        <ul>
          <li>Change your email account password.</li>
          <li>Enable two-factor authentication (2FA) if it is available.</li>
          <li>Review your account's recent activity for any suspicious behavior.</li>
        </ul>
        <p>Best regards,</p>
        <p>Xingchen Wei</p>
        <hr>
        <p style="font-size: 0.8em; color: #999;">This email was sent by Xingchen Wei to inform you about recent activity on your email account. If you did not authorize this action, please secure your account immediately.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false };
  }
};

const sendPasswordResetEmail = async (email, resetLink) => {
  let mailOptions;
  if (process.env.isSA === 'true') {
    mailOptions = {
      from: 'weixingchensimon@gmail.com',
      to: email,
      subject: 'Password Reset Request for Dr. Steve Hranilovic\'s Lab Homepage',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4CAF50;">Password Reset Request</h2>
          <p>Dear user,</p>
          <p>We received a request to reset the password for your account associated with this email address on Dr. Steve Hranilovic's lab homepage. If you did not request this change, please ignore this email.</p>
          <p>To reset your password, please use the link below:</p>
          <p><strong>Note:</strong> Since you are using the standalone client version, you need to copy this link and open it in a web browser on the computer running the focal client, ensuring that the focal client is running:</p>
          <p style="word-break: break-all;">${resetLink}</p>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you need further assistance, please do not hesitate to contact me.</p>
          <p>Best regards,</p>
          <p>Xingchen Wei<br>Technical Support for Dr. Steve Hranilovic's Lab Homepage</p>
          <hr>
          <p style="font-size: 0.8em; color: #999;">If you did not request a password reset, please ignore this email or reply to let us know. This email was sent by Xingchen Wei, providing technical support for the login system of Dr. Steve Hranilovic's lab homepage.</p>
        </div>
      `,
    };    
  } else {
    mailOptions = {
      from: 'weixingchensimon@gmail.com',
      to: email,
      subject: 'Password Reset Request for Dr. Steve Hranilovic\'s Lab Homepage',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4CAF50;">Password Reset Request</h2>
          <p>Dear user,</p>
          <p>We received a request to reset the password for your account associated with this email address on Dr. Steve Hranilovic's lab homepage. If you did not request this change, please ignore this email.</p>
          <p>To reset your password, please click the link below:</p>
          <p><a href="${resetLink}" style="color: #4CAF50;">Reset Password</a></p>
          <p>If the above link doesn't work, you can copy and paste the following URL into your web browser:</p>
          <p>${resetLink}</p>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you need further assistance, please do not hesitate to contact me.</p>
          <p>Best regards,</p>
          <p>Xingchen Wei<br>Technical Support for Dr. Steve Hranilovic's Lab Homepage</p>
          <hr>
          <p style="font-size: 0.8em; color: #999;">If you did not request a password reset, please ignore this email or reply to let us know. This email was sent by Xingchen Wei, providing technical support for the login system of Dr. Steve Hranilovic's lab homepage.</p>
        </div>
      `,
    };
  }
  

  try {
    await transporter.sendMail(mailOptions);
    sendSmtpUsageAlert('weixingchensimon@gmail.com');
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    sendSmtpUsageAlert('weixingchensimon@gmail.com');
    return { success: false };
  }
};

const sendEmail = async (data, req) => {
  const { name, email, message, ipAddress, language } = data;

  try {
    // 检查该IP地址在过去一天内发送的邮件数量
    const emailCountByIp = await new Promise((resolve, reject) => {
      console.log("E-mail ip:", ipAddress)
      getEmailCountByIp(ipAddress, (err, count) => {
        if (err) {
          logger.error('Error fetching email count by IP: %o', err);
          reject(err);
        } else {
          resolve(count);
        }
      });
    });

    if (emailCountByIp >= 5) {
      return { success: false, code: 'IP_EMAIL_LIMIT_REACHED' };
    }

    // 检查该邮箱地址在过去一天内发送的邮件数量
    const emailCountByEmail = await new Promise((resolve, reject) => {
      getEmailCountByEmail(email, (err, count) => {
        if (err) {
          logger.error('Error fetching email count by email: %o', err);
          reject(err);
        } else {
          resolve(count);
        }
      });
    });

    if (emailCountByEmail >= 5) {
      return { success: false, code: 'ADDRESS_EMAIL_LIMIT_REACHED' };
    }

    // 检查当天总的邮件发送次数
    const totalEmailCountToday = await new Promise((resolve, reject) => {
      getTotalEmailCountToday((err, count) => {
        if (err) {
          logger.error('Error fetching total email count for today: %o', err);
          reject(err);
        } else {
          resolve(count);
        }
      });
    });


    if (totalEmailCountToday >= 50) {
      return { success: false, code: 'MAX_EMAIL_LIMIT_REACHED'};
    }

    // 创建新的邮件记录
    await new Promise((resolve, reject) => {
      createEmail(name, email, message, ipAddress, (err, id) => {
        if (err) {
          logger.error('Error creating email record: %o', err);
          reject(err);
        } else {
          resolve(id);
        }
      });
    });

    // 发送邮件给自己
    const selfMailOptions = {
      from: 'weixingchensimon@gmail.com',
      to: 'weixingchensimon@gmail.com',
      subject: 'New Message from Your Website',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4CAF50;">New Message Notification</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
          <p>Best regards,</p>
          <p>Your Website</p>
        </div>
      `,
    };

    await transporter.sendMail(selfMailOptions);

    // 发送确认邮件给发件人
    // 英文邮件内容
    const englishContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #4CAF50; text-align: center;">Message Received</h2>
      <p>Dear ${name},</p>
      <p>Thank you for reaching out to me. I have successfully received your message and appreciate your interest. I will review your message and respond to you as soon as possible.</p>
      <p>In the meantime, you can visit my <a href="https://simonoren.com" style="color: #4CAF50;">personal homepage</a> for more information about my work and projects.</p>
      <div style="margin: 20px 0; padding: 10px; border: 1px solid #e0e0e0; border-radius: 5px; background-color: #f9f9f9; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
        <p><strong>Your Message:</strong></p>
        <p>${message}</p>
      </div>
      <p>If you did not send this message or believe it was sent in error, please ignore this email.</p>
      <p>For any further questions or assistance, do not hesitate to contact me again. I am here to help.</p>
      <p>Best regards,</p>
      <p style="font-style: italic;">Xingchen Wei</p>
      <hr style="border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <p style="font-size: 0.8em; color: #999; text-align: center;">This is an automated response to inform you that I have received your message. Please do not reply to this email.</p>
    </div>
  `;

  // 中英双语邮件内容
  const bilingualContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #4CAF50; text-align: center;">Message Received / 消息已收到</h2>
      <p>Dear ${name},</p>
      <p>Thank you for reaching out to me. I have successfully received your message and appreciate your interest. I will review your message and respond to you as soon as possible.</p>
      <p>In the meantime, you can visit my <a href="https://simonoren.com" style="color: #4CAF50;">personal homepage</a> for more information about my work and projects.</p>
      <p>${name},您好！</p>
      <p>感谢您与我联系。我已成功收到您的消息，并感谢您的关注。我会尽快查看您的消息并回复您。</p>
      <p>与此同时，您可以访问我的<a href="https://simonoren.com" style="color: #4CAF50;">个人主页</a>了解更多关于我的工作和项目的信息。</p>
      <div style="margin: 20px 0; padding: 10px; border: 1px solid #e0e0e0; border-radius: 5px; background-color: #f9f9f9; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
        <p><strong>Your Message / 您的消息:</strong></p>
        <p>${message}</p>
      </div>
      <p>If you did not send this message or believe it was sent in error, please ignore this email.</p>
      <p>For any further questions or assistance, do not hesitate to contact me again. I am here to help.</p>
      <p>如果您没有发送此消息或认为这是一个错误，请忽略此电子邮件。</p>
      <p>如有任何进一步的问题或需要帮助，请随时再次联系我。我会为您提供帮助。</p>
      <p>Best regards, 此致,</p>
      <p style="font-style: italic;">Xingchen Wei / 卫星辰</p>
      <hr style="border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <p style="font-size: 0.8em; color: #999; text-align: center;">This is an automated response to inform you that I have received your message. Please do not reply to this email.</p>
      <p style="font-size: 0.8em; color: #999; text-align: center;">这是自动回复邮件，通知您我已收到您的消息。请不要回复此邮件。</p>
    </div>
  `;

  // 根据语言选择内容
  const emailContent = language.toLowerCase() === 'zh' ? bilingualContent : englishContent;
  const emailSubject = language.toLowerCase() === 'zh' ? 'Your Message to Xingchen Wei Has Been Received / 您的消息已被卫星辰收到' : 'Your Message to Xingchen Wei Has Been Received';

  const confirmationMailOptions = {
    from: 'weixingchensimon@gmail.com',
    to: email,
    subject: emailSubject,
    html: emailContent,
  };

    await transporter.sendMail(confirmationMailOptions);
    // 输出日志信息
    logger.info(`IP ${ipAddress} has sent ${emailCountByIp + 1} emails today.`);
    logger.info(`Email ${email} has sent ${emailCountByEmail + 1} emails today.`);
    logger.info(`Total emails sent today: ${totalEmailCountToday + 1}.`);

    return { 
      success: true, 
      message: 'Email sent successfully!',
      emailCountByIp: emailCountByIp + 1,
      emailCountByEmail: emailCountByEmail + 1
    };
  } catch (error) {
    logger.error('Error sending email: %o', error);
    throw error;
  }
};


module.exports = { sendPasswordResetEmail, sendEmail };
