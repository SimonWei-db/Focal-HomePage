const db = require('../db');
const logger = require('../logger'); // 引入日志记录器
const crypto = require('crypto');

const createPasswordResetToken = (userId, callback) => {
  logger.info(`Creating password reset token for user ID: ${userId}`);
  
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 小时后过期

  const stmt = db.prepare("INSERT INTO password_resets (user_id, token, expires) VALUES (?, ?, ?)");
  stmt.run(userId, token, expires, function (err) {
    if (err) {
      logger.error(`Error creating password reset token for user ID: ${userId}`, err);
    } else {
      logger.info(`Password reset token created for user ID: ${userId}, Token: ${token}`);
    }
    callback(err, token);
  });
  stmt.finalize();
};

const getPasswordResetToken = (token, callback) => {
  logger.info(`Fetching password reset token: ${token}`);
  db.get("SELECT * FROM password_resets WHERE token = ?", [token], (err, row) => {
    if (err) {
      logger.error(`Error fetching password reset token: ${token}`, err);
    }
    callback(err, row);
  });
};

const getValidPasswordResetToken = (userId, callback) => {
  logger.info(`Checking for valid password reset token for user ID: ${userId}`);
  const now = new Date();
  db.get("SELECT * FROM password_resets WHERE user_id = ? AND expires > ?", [userId, now], (err, row) => {
    if (err) {
      logger.error(`Error fetching valid password reset token for user ID: ${userId}`, err);
    }
    callback(err, row);
  });
};

const deletePasswordResetToken = (token, callback) => {
  logger.info(`Deleting password reset token: ${token}`);
  const stmt = db.prepare("DELETE FROM password_resets WHERE token = ?");
  stmt.run(token, function (err) {
    if (err) {
      logger.error(`Error deleting password reset token: ${token}`, err);
    } else {
      logger.info(`Password reset token deleted: ${token}`);
    }
    callback(err);
  });
  stmt.finalize();
};

module.exports = {
  createPasswordResetToken,
  getPasswordResetToken,
  getValidPasswordResetToken,
  deletePasswordResetToken
};
