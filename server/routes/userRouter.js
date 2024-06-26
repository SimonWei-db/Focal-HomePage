const express = require('express');
const router = express.Router();
const {
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
  
} = require('../services/userService');
const authenticateJWT = require('../middleware/authMiddleware');
const logger = require('../logger'); // 引入日志记录器

// 验证JWT权限接口
router.get('/verify-token', authenticateJWT, (req, res) => {
  logger.info('Token verification attempt for user ID: %s', req.user.id);
  res.status(200).json({ success: true, message: 'Token is valid', user: req.user });
});

// 登录检查接口
router.post('/login', async (req, res) => {
  logger.info('Login attempt for username: %s', req.body.username);
  const { username, password } = req.body;

  try {
    const result = await authenticateUser(username, password, res);
    if (result.success) {
      logger.info('Login successful for username: %s', username);
      res.status(200).json(result);
    } else {
      logger.warn('Login failed for username: %s', username);
      res.status(200).json(result);
    }
  } catch (err) {
    logger.error(`Internal server error during login attempt for username: ${username}`, err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email, currentUrl } = req.body;
  try {
    const result = await sendPasswordResetEmail(email, currentUrl);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
  }
});


router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const result = await resetPassword(token, newPassword);
    if (result.success) {
      res.status(200).json({ success: true, message: 'Password reset successfully!' });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
  }
});

router.get('/verify-reset-token', async (req, res) => {
  const { token } = req.query;
  try {
    const result = await verifyResetToken(token);
    if (result.success) {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
  }
});


// 修改密码接口
router.post('/change-password', authenticateJWT, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // 从JWT中获取用户ID

  try {
    const result = await changePassword(userId, currentPassword, newPassword);
    if (result.success) {
      logger.info('Password changed successfully for user ID: %s', userId);
      res.status(200).json(result);
    } else {
      logger.warn('Password change failed for user ID: %s', userId);
      res.status(400).json(result);
    }
  } catch (err) {
    logger.error(`Error changing password for user ID: ${userId}`, err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 用户注册接口
router.post('/register', async (req, res) => {
  logger.info('Register attempt for username: %s', req.body.username);
  const { username, password } = req.body;

  try {
    const result = await registerUser(username, password, res);
    if (result.success) {
      logger.info('User registered successfully: %s', username);
      res.status(201).json(result);
    } else {
      logger.warn('Registration failed for username: %s', username);
      res.status(400).json(result);
    }
  } catch (err) {
    logger.error(`Internal server error during registration attempt for username: ${username}`, err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 获取所有用户
router.get('/', authenticateJWT, async (req, res) => {
  logger.info('Fetching all users');
  try {
    const users = await getAllUsersService();
    res.status(200).json(users);
  } catch (err) {
    logger.error('Error fetching all users', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 获取指定 ID 的用户
router.get('/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  logger.info('Fetching user by ID: %s', id);

  try {
    const user = await getUserByIdService(id);
    if (user) {
      res.status(200).json(user);
    } else {
      logger.warn('User not found by ID: %s', id);
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (err) {
    logger.error(`Error fetching user by ID: ${id}`, err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 更新指定 ID 的用户
router.put('/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;
  logger.info('Updating user by ID: %s', id);

  try {
    const result = await updateUserService(id, username, password);
    logger.info('User updated successfully by ID: %s', id);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Error updating user by ID: ${id}`, err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 删除指定 ID 的用户
router.delete('/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  logger.info('Deleting user by ID: %s', id);

  try {
    const result = await deleteUserService(id);
    logger.info('User deleted successfully by ID: %s', id);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Error deleting user by ID: ${id}`, err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
