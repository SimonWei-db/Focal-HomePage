const jwt = require('jsonwebtoken');
const { secret } = require('../config/config').jwt;
const logger = require('../logger');
const { refreshToken } = require('../services/authService'); // 引入刷新 JWT 的服务

const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (token) {
    jwt.verify(token, secret, (err, user) => {
      if (err) {
        logger.error('Token verification failed', { error: err });
        return res.status(401).json({ success: false, message: 'Token is not valid' }); // Forbidden
      }
      req.user = user;
      refreshToken(user, res); // 调用刷新 JWT 的服务
      next();
    });
  } else {
    logger.warn('No token provided');
    res.status(401).json({ success: false, message: 'No token provided' }); // Unauthorized
  }
};

module.exports = authenticateJWT;
