const express = require('express');
const router = express.Router();
const { getNews, batchProcessNews, getAllNewsService, getNewsByTypeService, deleteNewsService } = require('../services/newsService');
const authenticateJWT = require('../middleware/authMiddleware');
const logger = require('../logger'); // 引入日志记录器

// 获取单个 news 或 resource
router.get('/:id', async (req, res) => {
  try {
    const news = await getNews(req.params.id);
    res.status(200).json(news);
  } catch (err) {
    logger.error(`Internal server error while fetching news by ID: ${req.params.id}`, err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 获取所有 news 和 resources
router.get('/', async (req, res) => {
  try {
    const news = await getAllNewsService();
    res.status(200).json(news);
  } catch (err) {
    logger.error('Internal server error while fetching all news', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 获取特定类型的 news 或 resources
router.get('/type/:type', async (req, res) => {
  try {
    const news = await getNewsByTypeService(req.params.type);
    res.status(200).json(news);
  } catch (err) {
    logger.error(`Internal server error while fetching news by type: ${req.params.type}`, err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 批量创建、更新或删除 news 和 resources
router.post('/batchProcess', authenticateJWT, async (req, res) => {
  const { newsToCreate, newsToUpdate, newsToDelete, resourcesToCreate, resourcesToUpdate, resourcesToDelete } = req.body;
  try {
    const result = await batchProcessNews(newsToCreate, newsToUpdate, newsToDelete, resourcesToCreate, resourcesToUpdate, resourcesToDelete, req);
    res.status(200).json({
      success: true,
      message: 'Batch process completed successfully!',
      result: result
    });
  } catch (err) {
    logger.error('Internal server error while performing batch process', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 删除单个 news 或 resource
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const result = await deleteNewsService(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Internal server error while deleting news by ID: ${req.params.id}`, err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
