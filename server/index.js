const path = require('path');
const utilsService = require('./services/utilsService');
const logger = require('./logger'); // 引入日志记录器
require('dotenv').config(); // 确保在项目开始时加载环境变量
const express = require('express');
const app = express();
const cors = require('cors');
const userRouter = require('./routes/userRouter');
const aboutMeRouter = require('./routes/aboutMeRouter');
const imageUploadRouter = require('./routes/imageUploadRouter');
const publicationsRouter = require('./routes/publicationsRouter');
const teamRouter = require('./routes/teamRouter');
const newsRouter = require('./routes/newsRouter');
const fileRouter = require('./routes/fileRouter');
const pageRouter = require('./routes/pageRouter'); // 引入pageRoutes
const emailRouter = require('./routes/emailRouter');
const PORT = process.env.PORT || 8081;

const checkEnv = require('./checkEnv'); // 引入环境变量检查模块

// 捕获未处理的异常和拒绝的 Promise
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception: %o', err);
  process.exit(1); // 强制退出，以避免不一致状态
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at: %o, reason: %o', promise, reason);
  process.exit(1); // 强制退出，以避免不一致状态
});

checkEnv(); // 检查环境变量

const corsOptions = {
  origin: '*', // 替换为你允许的前端来源，如http://localhost:3000
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// 获取客户端真实 IP 地址
app.use((req, res, next) => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    req.ipAddress = xForwardedFor.split(',')[0].trim();
  } else {
    req.ipAddress = req.socket.remoteAddress;
  }
  next();
});

app.use(express.json());
app.use('/api/users', userRouter);
app.use('/api/about-me', aboutMeRouter);
app.use('/api/upload-image', imageUploadRouter);
app.use('/api/files', fileRouter);
app.use('/uploads/images', express.static(path.join(process.cwd(), 'server/uploads/images')));
app.use('/uploads/temp', express.static(path.join(process.cwd(), 'server/uploads/temp')));
app.use('/api/publications', publicationsRouter);
app.use('/api/team', teamRouter);
app.use('/api/news', newsRouter);
app.use('/api/pages', pageRouter); // 添加pageRouter
app.use('/api/email', emailRouter);

app.get('/uploads/files/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(process.cwd(), 'server/uploads/files', fileName);
  const parts = fileName.split('-');
  const originalName = parts.slice(1, -2).join('-') + path.extname(fileName); // 忽略第一个部分（'upload'），只使用后面的部分组合原始文件名

  if (req.query.download === 'true') {
    res.download(filePath, originalName, (err) => {
      if (err) {
        logger.error('Error downloading file: %o', err);
        res.status(500).send('Error downloading file');
      }
    });
  } else {
    res.sendFile(filePath, (err) => {
      if (err) {
        logger.error('Error sending file: %o', err);
        res.status(500).send('Error sending file');
      }
    });
  }
});

utilsService.scheduleTempDirCleanup();

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');

  // 这里执行你需要的任何清理操作，比如关闭数据库连接、保存状态等
  // ...

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app; // 确保模块导出
