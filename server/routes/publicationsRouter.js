const express = require('express');
const router = express.Router();
const { batchUpdateCategories, getAllCategoriesService } = require('../services/publicationsCategoriesService');
const { batchUpdateItems, getAllItemsService, getItemsByCategoryIdService } = require('../services/publicationsItemsService');
const authenticateJWT = require('../middleware/authMiddleware');
const logger = require('../logger'); // 引入日志记录器

// 获取所有 categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await getAllCategoriesService();
    res.status(200).json(categories);
  } catch (err) {
    logger.error('Internal server error while fetching categories', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 获取所有 items
router.get('/items', async (req, res) => {
  try {
    const items = await getAllItemsService();
    res.status(200).json(items);
  } catch (err) {
    logger.error('Internal server error while fetching items', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 获取单个 category 下的所有 items
router.get('/items/category/:categoryId', async (req, res) => {
  const categoryId = req.params.categoryId;
  try {
    const items = await getItemsByCategoryIdService(categoryId);
    res.status(200).json(items);
  } catch (err) {
    logger.error(`Internal server error while fetching items by category ID: ${categoryId}`, err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 批量修改或创建 categories 和 items
router.post('/batchUpdate', authenticateJWT, async (req, res) => {
  const { categoryUpdates, categoryDeletions, categoryCreations, itemUpdates, itemDeletions, itemCreations } = req.body;
  try {
    const categoryResult = await batchUpdateCategories(categoryUpdates, categoryDeletions, categoryCreations);
    const itemResult = await batchUpdateItems(itemUpdates, itemDeletions, itemCreations, categoryResult.idMap, req);
    res.status(200).json({
      success: true,
      message: 'Batch update completed successfully!',
      categories: categoryResult,
      items: itemResult
    });
  } catch (err) {
    logger.error('Internal server error while performing batch update', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
