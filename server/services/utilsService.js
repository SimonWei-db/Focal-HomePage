const fs = require('fs');
const path = require('path');
const multer = require('multer');
const logger = require('../logger');
const schedule = require('node-schedule');
const tempDir = path.join(process.cwd(), 'server/uploads/temp');

const dayOfWeekMap = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday'
};

const scheduleTempDirCleanup = () => {
  const rule = new schedule.RecurrenceRule();
  // 设置定时任务规则
  rule.dayOfWeek = 0; // 星期天
  rule.hour = 0;     // 0 点
  rule.minute = 1;   // 01 分

  schedule.scheduleJob(rule, () => {
    logger.info(`Scheduled delete temp file task run.`);
    fs.readdir(tempDir, (err, files) => {
      if (err) {
        logger.error('Error reading temp directory:', err);
        return console.error('Error reading temp directory:', err);
      }

      files.forEach(file => {
        const filePath = path.join(tempDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) {
            logger.error('Error stating file:', err);
            return console.error('Error stating file:', err);
          }

          // 删除 一周前创建的文件
          if (Date.now() - stats.ctimeMs > 7 * 24 * 60 * 60 * 1000) {
            fs.unlink(filePath, err => {
              if (err) {
                logger.error('Error deleting file:', err);
                return console.error('Error deleting file:', err);
              }
              logger.info('Deleted old temporary file:' + filePath);
            });
          }
        });
      });
    });
  });

  const dayName = dayOfWeekMap[rule.dayOfWeek !== undefined ? rule.dayOfWeek : new Date().getDay()];

  logger.info(`Scheduled task set to run every ${dayName} at ${rule.hour}:${rule.minute} (server local time)`);
};


// 设置 multer 存储配置
const tempStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(process.cwd(), 'server/uploads/temp');
    // 检查目录是否存在，如果不存在则创建它
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir); // 临时存储目录
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: tempStorage });

// 移动图片
const moveImage = (source, destination) => {
  return new Promise((resolve, reject) => {
    fs.rename(source, destination, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};


const deleteImage = (imagePath) => {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(imagePath);

    // Check if the file name starts with 'origin-'
    if (fileName.startsWith('origin-')) {
      console.log(`Skipping deletion of ${fileName}`);
      resolve();
      return;
    }

    fs.unlink(imagePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};


// 清理未使用的图片
const cleanUnusedImages = (directory, usedImages) => {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) {
        return reject(err);
      }

      const unusedImages = files.filter(file => !usedImages.has(file) && !file.startsWith('origin-'));
      const deletePromises = unusedImages.map(file => {
        const filePath = path.join(directory, file);
        return new Promise((resolve, reject) => {
          fs.unlink(filePath, err => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });

      Promise.all(deletePromises)
        .then(() => resolve())
        .catch(reject);
    });
  });
};

// 处理图片转移和清理
const handleImages = async (newImage, oldImage, req, finalDirPath, tempDirPath = 'uploads/temp') => {
  if(newImage === oldImage){
    return newImage;
  }
  const tempDir = path.join(process.cwd(), 'server', tempDirPath);
  const finalDir = path.join(process.cwd(), 'server', finalDirPath);

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const isTempImage = (imageUrl) => {
    const normalizedTempDirPath = path.normalize(tempDirPath).replace(/\\/g, '/'); // Normalize and replace backslashes with forward slashes
    const tempPath = normalizedTempDirPath.replace(/^\.\.\//, ''); // Remove leading ../ if present
    return imageUrl.startsWith('http') && imageUrl.includes(tempPath);
  };

  const oldFileName = oldImage ? path.basename(oldImage) : null;

  if (!newImage || newImage.trim() === '') {
    if (oldFileName && oldFileName.trim() !== '' && fs.existsSync(path.join(finalDir, oldFileName))) {
      console.log('DeleteImage, Cause NewImage is', newImage ,path.join(finalDir, oldFileName));
      await deleteImage(path.join(finalDir, oldFileName));
    }
    return null;
  }

  const newFileName = path.basename(newImage);

  if (isTempImage(newImage)) {
    const tempImagePath = path.join(tempDir, newFileName);
    const finalImagePath = path.join(finalDir, newFileName);

    if (newFileName.trim() !== '' && fs.existsSync(tempImagePath)) {
      await moveImage(tempImagePath, finalImagePath);
    }

    if (oldFileName && oldFileName.trim() !== '' && fs.existsSync(path.join(finalDir, oldFileName))) {
      await deleteImage(path.join(finalDir, oldFileName));
      console.log('Delete Old Image', path.join(finalDir, oldFileName));
    }

    return `${finalDirPath}/${newFileName}`;
  } else if (newImage.startsWith(baseUrl)) {
    return newImage.replace(baseUrl, '');
  } else {
    return newImage;
  }
};

// 上传临时图片
const uploadTempImage = (req, res, callback) => {
  upload.single('Image')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      logger.error('Multer error:', err);
      callback({ success: false, error: err, code: 500, message: 'Multer error occurred when uploading.' });
    } else if (err) {
      logger.error('Unknown error:', err);
      callback({ success: false, error: err, code: 500, message: 'Unknown error occurred when uploading.' });
    } else if (!req.file) {
      logger.error('No file uploaded.');
      callback({ success: false, code: 400, message: 'No file uploaded.' });
    } else {
      const tempImageUrl = `${req.protocol}://${req.get('host')}/uploads/temp/${req.file.filename}`;
      logger.info('Temporary file uploaded successfully: ' + tempImageUrl);
      callback({ success: true, code: 200, imageUrl: tempImageUrl });
    }
  });
};

const filesDir = path.join(process.cwd(), 'server/uploads/files');
const filesDirIsSA = path.join(process.cwd(), 'client/build/upload_files/UserCloud');

// 获取 uploads/files 目录下的所有文件名及每个文件的大小
const getFilesWithSizes = (directory) => {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) {
        return reject(err);
      }

      const fileDetailsPromises = files.map(file => {
        const filePath = path.join(directory, file);
        return new Promise((resolve, reject) => {
          fs.stat(filePath, (err, stats) => {
            if (err) {
              reject(err);
            } else {
              // 分割并移除 'upload-' 前缀
              const parts = file.split('-');
              const originalName = parts.slice(1, -2).join('-') + path.extname(file); // 忽略第一个部分（'upload'），只使用后面的部分组合原始文件名
              const uploadTime = new Date(parseInt(parts.slice(-2, -1)[0]));
              resolve({ fileName: file, originalName, uploadTime, size: stats.size });
            }
          });
        });
      });

      Promise.all(fileDetailsPromises)
        .then(fileDetails => resolve(fileDetails))
        .catch(reject);
    });
  });
};

// 设置 multer 存储配置（用于文件上传）
const filesStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, filesDir); // 文件存储目录
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = file.originalname.replace(path.extname(file.originalname), '');
    cb(null, `upload-${originalName}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadFile = multer({ storage: filesStorage });

// 上传文件到 uploads/files 目录
const uploadFileToDirectory = (req, res, callback) => {
  uploadFile.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      logger.error('Multer error:', err);
      callback({ success: false, error: err, code: 500, message: 'Multer error occurred when uploading.' });
    } else if (err) {
      logger.error('Unknown error:', err);
      callback({ success: false, error: err, code: 500, message: 'Unknown error occurred when uploading.' });
    } else if (!req.file) {
      logger.error('No file uploaded.');
      callback({ success: false, code: 400, message: 'No file uploaded.' });
    } else {
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/files/${req.file.filename}`;
      logger.info('File uploaded successfully: ' + fileUrl);
      if (process.env.isSA === 'true') {
        // 复制文件到 filesDirIsSA 目录
        const originalFilePath = path.join(filesDir, req.file.filename);
        const copyFilePath = path.join(filesDirIsSA, req.file.filename);

        fs.mkdirSync(filesDirIsSA, { recursive: true }); // 确保目标目录存在

        fs.copyFile(originalFilePath, copyFilePath, (err) => {
          if (err) {
            logger.error('Error copying file:', err);
            callback({ success: false, error: err, code: 500, message: 'Error occurred while copying file.' });
          } else {
            logger.info('File copied successfully to SA directory: ' + copyFilePath);
            callback({ success: true, code: 200, fileUrl: fileUrl });
          }
        });
      } else {
        callback({ success: true, code: 200, fileUrl: fileUrl });
      }
    }
  });
};


module.exports = {
  uploadTempImage,
  handleImages,
  deleteImage,
  scheduleTempDirCleanup,
  getFilesWithSizes,
  uploadFileToDirectory
};
