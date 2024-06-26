require('dotenv').config(); // 加载环境变量
const logger = require('./logger'); // 引入日志记录器

const requiredEnvVars = [
  'JWT_SECRET',
  // 如果有其他需要的环境变量，可以在这里添加
];

const checkEnv = () => {
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    logger.error('Missing required environment variables: %s', missingEnvVars.join(', '));
    process.exit(1); // 退出进程，并返回非零状态码，表示错误
  } else {
    logger.info('All required environment variables are set.');
  }
};

module.exports = checkEnv;
