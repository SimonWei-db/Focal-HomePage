const db = require('../db');
const logger = require('../logger'); // 引入日志记录器

const getPageById = (id, callback) => {
  logger.info(`Fetching page by ID: ${id}`);
  db.get("SELECT * FROM pages WHERE id = ? AND deleted_at IS NULL", [id], (err, row) => {
    if (err) {
      logger.error(`Error fetching page by ID: ${id}`, err);
    }
    callback(err, row);
  });
};

const createPage = (param, title, content, callback) => {
  const currentTimestamp = new Date().toISOString(); // 生成当前时间戳
  logger.info('Creating page');
  const stmt = db.prepare("INSERT INTO pages (param, title, content, updated_at) VALUES (?, ?, ?, ?)");
  stmt.run(param, title, content, currentTimestamp, function (err) {
    if (err) {
      logger.error('Error creating page', err);
    } else {
      logger.info(`Page created with ID: ${this.lastID}`);
    }
    callback(err, this.lastID);
  });
  stmt.finalize();
};


const updatePage = (id, title, content, callback) => {
  const currentTimestamp = new Date().toISOString(); // 生成当前时间戳
  logger.info(`Updating page by ID: ${id}`);
  const stmt = db.prepare("UPDATE pages SET title = ?, content = ?, updated_at = ? WHERE id = ?");
  stmt.run(title, content, currentTimestamp, id, function (err) {
    if (err) {
      logger.error(`Error updating page by ID: ${id}`, err);
    } else {
      logger.info(`Page updated with ID: ${id}`);
    }
    callback(err);
  });
  stmt.finalize();
};


const deletePage = (id, callback) => {
  logger.info(`Deleting page by ID: ${id}`);
  const stmt = db.prepare("UPDATE pages SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?");
  stmt.run(id, function (err) {
    if (err) {
      logger.error(`Error deleting page by ID: ${id}`, err);
    } else {
      logger.info(`Page deleted with ID: ${id}`);
    }
    callback(err);
  });
  stmt.finalize();
};

const getAllPages = (callback) => {
  logger.info('Fetching all pages');
  db.all("SELECT id, param, title, created_at, updated_at, deleted_at FROM pages WHERE deleted_at IS NULL", (err, rows) => {
    if (err) {
      logger.error('Error fetching all pages', err);
    }
    callback(err, rows);
  });
};

const getPageByParam = (param, callback) => {
  logger.info(`Fetching page by param: ${param}`);
  db.get("SELECT * FROM pages WHERE param = ? AND deleted_at IS NULL", [param], (err, row) => {
    if (err) {
      logger.error(`Error fetching page by param: ${param}`, err);
    }
    callback(err, row);
  });
};

module.exports = {
  getPageById,
  createPage,
  updatePage,
  deletePage,
  getAllPages,
  getPageByParam
};
