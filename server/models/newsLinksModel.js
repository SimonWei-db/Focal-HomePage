const db = require('../db');
const logger = require('../logger'); // 引入日志记录器

const getLinksByNewsId = (newsId, callback) => {
  db.all("SELECT * FROM news_links WHERE news_id = ?", [newsId], (err, rows) => {
    if (err) {
      logger.error(`Error fetching links by news ID: ${newsId}`, err);
    }
    callback(err, rows);
  });
};

const createLink = (newsId, url, label, callback) => {
  logger.info('Creating link');
  const stmt = db.prepare("INSERT INTO news_links (news_id, url, label) VALUES (?, ?, ?)");
  stmt.run(newsId, url, label, function (err) {
    if (err) {
      logger.error('Error creating link', err);
    } else {
      logger.info(`Link created with ID: ${this.lastID}`);
    }
    callback(err, this.lastID);
  });
  stmt.finalize();
};

const deleteLink = (id, callback) => {
  logger.info(`Deleting link by ID: ${id}`);
  const stmt = db.prepare("DELETE FROM news_links WHERE id = ?");
  stmt.run(id, function (err) {
    if (err) {
      logger.error(`Error deleting link by ID: ${id}`, err);
    } else {
      logger.info(`Link deleted with ID: ${id}`);
    }
    callback(err);
  });
  stmt.finalize();
};

const deleteLinksByNewsId = (newsId, callback) => {
  logger.info(`Deleting links by news ID: ${newsId}`);
  const stmt = db.prepare("DELETE FROM news_links WHERE news_id = ?");
  stmt.run(newsId, function (err) {
    if (err) {
      logger.error(`Error deleting links by news ID: ${newsId}`, err);
    } else {
      logger.info(`Links deleted for news ID: ${newsId}`);
    }
    callback(err);
  });
  stmt.finalize();
};

module.exports = {
  getLinksByNewsId,
  createLink,
  deleteLink,
  deleteLinksByNewsId
};
