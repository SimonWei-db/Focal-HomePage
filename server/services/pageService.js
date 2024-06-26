const { getPageById, createPage, updatePage, deletePage, getAllPages, getPageByParam } = require('../models/pageModel');
const logger = require('../logger'); // 引入日志记录器
const crypto = require('crypto'); // 引入crypto模块

const getPage = async (id) => {
  return new Promise((resolve, reject) => {
    getPageById(id, (err, page) => {
      if (err) {
        logger.error(`Error fetching page by ID: ${id}`, err);
        reject(err);
      } else {
        resolve(page);
      }
    });
  });
};

const createNewPage = async (pageData) => {
  const { title, content } = pageData;
  const param = crypto.randomBytes(32).toString('hex'); // 生成一个唯一的param参数
  return new Promise((resolve, reject) => {
    createPage(param, title, content, (err, newId) => {
      if (err) {
        logger.error('Error creating page', err);
        reject(err);
      } else {
        resolve({ success: true, message: `Page created successfully with ID: ${newId}`, id: newId, param });
      }
    });
  });
};

const updateExistingPage = async (pageId, pageData) => {
  const { title, content } = pageData; // 从 pageData 中排除 param
  return new Promise((resolve, reject) => {
    updatePage(pageId, title, content, (err) => {
      if (err) {
        logger.error(`Error updating page by ID: ${pageId}`, err);
        reject(err);
      } else {
        resolve({ success: true, message: `Page updated successfully with ID: ${pageId}` });
      }
    });
  });
};

const deleteExistingPage = async (pageId) => {
  return new Promise((resolve, reject) => {
    deletePage(pageId, (err) => {
      if (err) {
        logger.error(`Error deleting page by ID: ${pageId}`, err);
        reject(err);
      } else {
        resolve({ success: true, message: 'Page deleted successfully!' });
      }
    });
  });
};

const getAllPagesService = async () => {
  return new Promise((resolve, reject) => {
    getAllPages((err, pages) => {
      if (err) {
        logger.error('Error fetching all pages', err);
        reject(err);
      } else {
        resolve({ success: true, pages });
      }
    });
  });
};

const getPageByParamService = async (param) => {
    return new Promise((resolve, reject) => {
      getPageByParam(param, (err, page) => {
        if (err) {
          logger.error(`Error fetching page by param: ${param}`, err);
          reject(err);
        } else if (page) {
          resolve({ success: true, page });
        } else {
          resolve({ success: false, message: 'Page not found' });
        }
      });
    });
  };
  

module.exports = {
  getPage,
  createNewPage,
  updateExistingPage,
  deleteExistingPage,
  getAllPagesService,
  getPageByParamService
};
