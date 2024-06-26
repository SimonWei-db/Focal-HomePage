const jwt = require('jsonwebtoken');
const { secret, expiresIn } = require('../config/config').jwt;
const logger = require('../logger');

const signToken = (user) => {
  const expiresTime = process.env.isSA === 'true' ? '24h' : expiresIn;
  const token = jwt.sign({ id: user.id, username: user.username }, secret, { 'expiresIn': expiresTime });
  logger.info('Signed new JWT for user: %s, expiresTime: %s', user.username, expiresTime );
  return token;
};

const signAndSetToken = (user, res) => {
  const token = signToken(user);
  res.setHeader('Authorization', `Bearer ${token}`);
  return token;
};

const refreshToken = (user, res) => {
  const now = Math.floor(Date.now() / 1000);
  const tokenExpiration = user.exp;
  const tokenIssuedAt = user.iat;
  const halfLife = (tokenExpiration - tokenIssuedAt) / 2;

  if (now > tokenIssuedAt + halfLife) {
    signAndSetToken(user, res);
    logger.info('Refreshed JWT for user: %s', user.username);
  }
};

module.exports = {
  signToken,
  signAndSetToken,
  refreshToken,
};
