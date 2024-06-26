const express = require('express');
const router = express.Router();
const {
  getPage,
  createNewPage,
  updateExistingPage,
  deleteExistingPage,
  getAllPagesService,
  getPageByParamService
} = require('../services/pageService');
const authenticateJWT = require('../middleware/authMiddleware');
const logger = require('../logger'); // 引入日志记录器

// 获取单个页面
router.get('/:id', async (req, res) => {
  try {
    const page = await getPage(req.params.id);
    res.status(200).json(page);
  } catch (err) {
    logger.error(`Internal server error while fetching page by ID: ${req.params.id}`, err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 获取所有页面
router.get('/', async (req, res) => {
  try {
    const pages = await getAllPagesService();
    res.status(200).json(pages);
  } catch (err) {
    logger.error('Internal server error while fetching all pages', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 根据param获取页面
router.get('/param/:param', async (req, res) => {
  try {
    const page = await getPageByParamService(req.params.param);
    res.status(200).json(page);
  } catch (err) {
    logger.error(`Internal server error while fetching page by param: ${req.params.param}`, err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 创建新页面
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const result = await createNewPage(req.body);
    res.status(201).json(result);
  } catch (err) {
    logger.error('Internal server error while creating page', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 更新页面
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const result = await updateExistingPage(req.params.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Internal server error while updating page by ID: ${req.params.id}`, err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 删除页面
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const result = await deleteExistingPage(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Internal server error while deleting page by ID: ${req.params.id}`, err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
