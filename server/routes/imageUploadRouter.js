const express = require('express');
const router = express.Router();
const { uploadTempImage } = require('../services/utilsService');
const authenticateJWT = require('../middleware/authMiddleware');
const logger = require('../logger');

// 上传临时图片路由
router.post('/', authenticateJWT, (req, res) => {
  uploadTempImage(req, res, (result) => {
    if (result.success) {
      res.status(result.code).json({ success: true, imageUrl: result.imageUrl });
    } else {
      logger.error(result.message, result.error);
      res.status(result.code).json({ success: false, message: result.message });
    }
  });
});

module.exports = router;
