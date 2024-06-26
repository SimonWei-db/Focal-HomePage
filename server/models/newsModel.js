const db = require('../db');
const logger = require('../logger'); // 引入日志记录器

const getNewsById = (id, callback) => {
  logger.info(`Fetching news by ID: ${id}`);
  db.get("SELECT * FROM news WHERE id = ? AND deleted_at IS NULL", [id], (err, row) => {
    if (err) {
      logger.error(`Error fetching news by ID: ${id}`, err);
    }
    callback(err, row);
  });
};

const createNews = (type, title, description, date, image, callback) => {
  logger.info('Creating news');
  const stmt = db.prepare("INSERT INTO news (type, title, description, date, image) VALUES (?, ?, ?, ?, ?)");
  stmt.run(type, title, description, date, image, function (err) {
    if (err) {
      logger.error('Error creating news', err);
    } else {
      logger.info(`News created with ID: ${this.lastID}`);
    }
    callback(err, this.lastID);
  });
  stmt.finalize();
};

const updateNews = (id, type, title, description, date, image, callback) => {
  logger.info(`Updating news by ID: ${id}`);
  const stmt = db.prepare("UPDATE news SET type = ?, title = ?, description = ?, date = ?, image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
  stmt.run(type, title, description, date, image, id, function (err) {
    if (err) {
      logger.error(`Error updating news by ID: ${id}`, err);
    } else {
      logger.info(`News updated with ID: ${id}`);
    }
    callback(err);
  });
  stmt.finalize();
};

const deleteNews = (id, callback) => {
  logger.info(`Deleting news by ID: ${id}`);
  const stmt = db.prepare("UPDATE news SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?");
  stmt.run(id, function (err) {
    if (err) {
      logger.error(`Error deleting news by ID: ${id}`, err);
    } else {
      logger.info(`News deleted with ID: ${id}`);
    }
    callback(err);
  });
  stmt.finalize();
};

const getAllNews = (callback) => {
  logger.info('Fetching all news');
  db.all("SELECT * FROM news WHERE deleted_at IS NULL", (err, rows) => {
    if (err) {
      logger.error('Error fetching all news', err);
    }
    callback(err, rows);
  });
};

const getNewsByType = (type, callback) => {
  logger.info(`Fetching news by type: ${type}`);
  db.all("SELECT * FROM news WHERE type = ? AND deleted_at IS NULL", [type], (err, rows) => {
    if (err) {
      logger.error(`Error fetching news by type: ${type}`, err);
    }
    callback(err, rows);
  });
};

module.exports = {
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  getAllNews,
  getNewsByType
};
