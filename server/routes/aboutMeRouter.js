const express = require('express');
const router = express.Router();
const { getAboutMe, saveAboutMe } = require('../services/aboutMeService');
const authenticateJWT = require('../middleware/authMiddleware');
const logger = require('../logger'); // 引入日志记录器

// 查询 about_me 内容
router.get('/', async (req, res) => {
  try {
    const aboutMe = await getAboutMe(req);
    if (aboutMe) {
      res.status(200).json(aboutMe);
    } else {
      res.status(404).json({ success: false, message: 'Content not found' });
    }
  } catch (err) {
    logger.error('Internal server error while fetching about_me content', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 更新 about_me 内容
router.post('/', authenticateJWT, async (req, res) => {
  const content = req.body;
  try {
    const result = await saveAboutMe(content,req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    logger.error('Internal server error while saving about_me content', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
