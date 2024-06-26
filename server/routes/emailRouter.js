const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/emailService');
const logger = require('../logger'); // 引入日志记录器

// 发送邮件
router.post('/send', async (req, res) => {
  const { name, email, message, language = 'en'} = req.body;
  const ipAddress = req.ipAddress;; // 获取客户端IP地址
  const emailData = { name, email, message, ipAddress, language};

  try {
    const result = await sendEmail(emailData, req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    logger.error('Internal server error while sending email', err);
    res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR' });
  }
});

module.exports = router;
