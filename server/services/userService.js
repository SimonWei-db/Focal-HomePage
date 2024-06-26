const bcryptjs = require('bcryptjs');
const logger = require('../logger');
const { getUserByUsername, createUser, getAllUsers, getUserById, updateUser, deleteUser, updateUserPassword } = require('../models/userModel');
const { saltRounds } = require('../config/config').bcrypt;
const { signAndSetToken } = require('../services/authService'); // 引入签发和设置 JWT 的服务
const { createPasswordResetToken, getPasswordResetToken, getValidPasswordResetToken, deletePasswordResetToken } = require('../models/passwordResetModel');
const emailService = require('../services/emailService'); // 引入邮件服务

const authenticateUser = async (username, password, res) => {
  return new Promise((resolve, reject) => {
    getUserByUsername(username, async (err, user) => {
      if (err) {
        logger.error('Error fetching user by username: %o', err);
        reject(err);
      } else if (!user) {
        logger.warn('Invalid username or password for username: %s', username);
        resolve({ success: false, message: 'Invalid username or password' });
      } else {
        const match = await bcryptjs.compare(password, user.password);
        if (match) {
          const token = signAndSetToken(user, res);
          logger.info('User authenticated successfully: %s', username);
          const passwordNotChanged = user.created_at === user.updated_at;
          resolve({ success: true, message: 'Login successful!', token, passwordNotChanged });
        } else {
          logger.warn('Invalid username or password for username: %s', username);
          resolve({ success: false, message: 'Invalid username or password' });
        }
      }
    });
  });
};

const changePassword = async (userId, currentPassword, newPassword) => {
  return new Promise((resolve, reject) => {
    getUserById(userId, async (err, user) => {
      if (err) {
        logger.error('Error fetching user by ID: %o', err);
        reject(err);
      } else if (!user) {
        logger.warn('User not found by ID: %s', userId);
        resolve({ success: false, message: 'User not found' });
      } else {
        if (user.username === 'weixingchensimon@gmail.com') {
          logger.warn('Password change attempt for test user: %s', userId);
          resolve({ success: false, message: 'Test user, password change not allowed' });
          return;
        }

        const match = await bcryptjs.compare(currentPassword, user.password);
        if (match) {
          const hashedPassword = await bcryptjs.hash(newPassword, saltRounds);
          updateUserPassword(userId, hashedPassword, (err) => {
            if (err) {
              logger.error('Error changing password for user: %o', err);
              reject(err);
            } else {
              logger.info('Password changed successfully for user: %s', userId);
              resolve({ success: true, message: 'Password changed successfully!' });
            }
          });
        } else {
          logger.warn('Current password does not match for user ID: %s', userId);
          resolve({ success: false, message: 'Current password is incorrect' });
        }
      }
    });
  });
};

const registerUser = async (username, password, res) => {
  return new Promise((resolve, reject) => {
    getUserByUsername(username, async (err, user) => {
      if (err) {
        logger.error('Error fetching user by username: %o', err);
        reject(err);
      } else if (user) {
        logger.warn('Username already exists: %s', username);
        resolve({ success: false, message: 'Username already exists' });
      } else {
        const hashedPassword = await bcryptjs.hash(password, saltRounds);
        createUser(username, hashedPassword, (err, userId) => {
          if (err) {
            logger.error('Error creating user: %o', err);
            reject(err);
          } else {
            logger.info('User registered successfully: %s', username);
            const token = signAndSetToken({ id: userId, username }, res); // 注册后立即签发并设置 token
            resolve({ success: true, message: 'User registered successfully!', userId, token });
          }
        });
      }
    });
  });
};

const getAllUsersService = () => {
  return new Promise((resolve, reject) => {
    getAllUsers((err, users) => {
      if (err) {
        logger.error('Error fetching all users: %o', err);
        reject(err);
      } else {
        logger.info('Fetched all users');
        resolve(users);
      }
    });
  });
};

const getUserByIdService = (id) => {
  return new Promise((resolve, reject) => {
    getUserById(id, (err, user) => {
      if (err) {
        logger.error('Error fetching user by id: %o', err);
        reject(err);
      } else {
        logger.info('Fetched user by id: %s', id);
        resolve(user);
      }
    });
  });
};

const updateUserService = async (id, username, password) => {
  const hashedPassword = await bcryptjs.hash(password, saltRounds);
  return new Promise((resolve, reject) => {
    updateUser(id, username, hashedPassword, (err) => {
      if (err) {
        logger.error('Error updating user: %o', err);
        reject(err);
      } else {
        logger.info('User updated successfully: %s', id);
        resolve({ success: true, message: 'User updated successfully!' });
      }
    });
  });
};

const deleteUserService = (id) => {
  return new Promise((resolve, reject) => {
    deleteUser(id, (err) => {
      if (err) {
        logger.error('Error deleting user: %o', err);
        reject(err);
      } else {
        logger.info('User deleted successfully: %s', id);
        resolve({ success: true, message: 'User deleted successfully!' });
      }
    });
  });
};

const sendPasswordResetEmail = async (username, currentUrl) => {
  return new Promise((resolve, reject) => {
    getUserByUsername(username, async (err, user) => {
      if (err) {
        logger.error('Error fetching user by username: %o', err);
        reject(err);
      } else if (!user) {
        logger.warn('User not found for username: %s', username);
        resolve({ success: false, message: 'The specified user account could not be located. Please verify the username and try again.' });
      } else {
        getValidPasswordResetToken(user.id, async (err, validToken) => {
          if (err) {
            logger.error('Error checking valid password reset token for user ID: %s', user.id, err);
            reject(err);
          } else if (validToken) {
            logger.warn('A valid password reset token already exists for user ID: %s', user.id);
            resolve({ success: false, message: 'A password reset request is already in process and is valid for one hour. Please check your email for the reset link. If needed, try again later.' });
          } else {
            createPasswordResetToken(user.id, async (err, token) => {
              if (err) {
                logger.error('Error creating password reset token for user ID: %s', user.id, err);
                reject(err);
              } else {
                const resetLink = currentUrl.replace('ForgotPassword', `ResetPassword?token=${token}`);
                const emailResult = await emailService.sendPasswordResetEmail(username, resetLink);
                if (emailResult.success) {
                  logger.info('Password reset email sent successfully to: %s', username);
                  resolve({ success: true, message: 'Password reset email sent successfully!' });
                } else {
                  logger.error('Error sending password reset email to: %s', username);
                  resolve({ success: false, message: 'Error sending password reset email' });
                }
              }
            });
          }
        });
      }
    });
  });
};

const resetPassword = async (token, newPassword) => {
  return new Promise((resolve, reject) => {
    getPasswordResetToken(token, async (err, resetToken) => {
      if (err) {
        logger.error('Error fetching password reset token: %o', err);
        reject(err);
      } else if (!resetToken) {
        logger.warn('Invalid password reset token: %s', token);
        resolve({ success: false, message: 'Invalid password reset token' });
      } else {
        const now = new Date();
        if (now > new Date(resetToken.expires)) {
          logger.warn('Expired password reset token: %s', token);
          resolve({ success: false, message: 'Expired password reset token' });
        } else {
          const hashedPassword = await bcryptjs.hash(newPassword, saltRounds);
          updateUserPassword(resetToken.user_id, hashedPassword, (err) => {
            if (err) {
              logger.error('Error updating password for user ID: %s', resetToken.user_id, err);
              reject(err);
            } else {
              deletePasswordResetToken(token, (err) => {
                if (err) {
                  logger.error('Error deleting password reset token: %s', token, err);
                  reject(err);
                } else {
                  logger.info('Password reset successfully for user ID: %s', resetToken.user_id);
                  resolve({ success: true, message: 'Password reset successfully!' });
                }
              });
            }
          });
        }
      }
    });
  });
};


const verifyResetToken = async (token) => {
  return new Promise((resolve, reject) => {
    getPasswordResetToken(token, (err, resetToken) => {
      if (err) {
        logger.error('Error fetching password reset token: %o', err);
        reject(err);
      } else if (!resetToken) {
        resolve({ success: false, message: 'Invalid reset token' });
      } else {
        const now = new Date();
        if (now > new Date(resetToken.expires)) {
          logger.warn('Expired reset token: %s', token);
          resolve({ success: false, message: 'Expired reset token' });
        } else {
          resolve({ success: true });
        }
      }
    });
  });
};


module.exports = {
  authenticateUser,
  registerUser,
  getAllUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
  changePassword,
  sendPasswordResetEmail,
  resetPassword,
  verifyResetToken
};
