const express = require('express');
const router = express.Router();
const { getTeam, saveTeam } = require('../services/teamService');
const authenticateJWT = require('../middleware/authMiddleware');
const logger = require('../logger'); // 引入日志记录器

// 查询 team 内容
router.get('/', async (req, res) => {
  try {
    const team = await getTeam(req);
    if (team) {
      res.status(200).json(team);
    } else {
      res.status(404).json({ success: false, message: 'Content not found' });
    }
  } catch (err) {
    logger.error('Internal server error while fetching team content', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 更新 team 内容
router.post('/', authenticateJWT, async (req, res) => {
  const content = req.body;
  try {
    const result = await saveTeam(content, req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    logger.error('Internal server error while saving team content', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
