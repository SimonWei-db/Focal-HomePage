const db = require('../db');
const logger = require('../logger'); // 引入日志记录器

const getAboutMeById = (id, callback) => {
  logger.info(`Fetching about_me content by ID: ${id}`);
  db.get("SELECT * FROM about_me WHERE id = ? AND deleted_at IS NULL", [id], (err, row) => {
    if (err) {
      logger.error(`Error fetching about_me content by ID: ${id}`, err);
    }
    callback(err, row);
  });
};

const getLatestAboutMe = (callback) => {
  logger.info('Fetching latest about_me content');
  db.get("SELECT * FROM about_me WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 1", (err, row) => {
    if (err) {
      logger.error('Error fetching latest about_me content', err);
    }
    callback(err, row);
  });
};

const createAboutMe = (content, callback) => {
  logger.info(`Creating about_me content`);
  const stmt = db.prepare("INSERT INTO about_me (content) VALUES (?)");
  stmt.run(JSON.stringify(content), function (err) {
    if (err) {
      logger.error('Error creating about_me content', err);
    } else {
      logger.info(`about_me content created with ID: ${this.lastID}`);
    }
    callback(err, this.lastID);
  });
  stmt.finalize();
};

const updateAboutMe = (id, content, callback) => {
  logger.info(`Updating about_me content by ID: ${id}`);
  const stmt = db.prepare("UPDATE about_me SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
  stmt.run(JSON.stringify(content), id, function (err) {
    if (err) {
      logger.error(`Error updating about_me content by ID: ${id}`, err);
    } else {
      logger.info(`about_me content updated with ID: ${id}`);
    }
    callback(err);
  });
  stmt.finalize();
};

const deleteAboutMe = (id, callback) => {
  logger.info(`Deleting about_me content by ID: ${id}`);
  const stmt = db.prepare("UPDATE about_me SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?");
  stmt.run(id, function (err) {
    if (err) {
      logger.error(`Error deleting about_me content by ID: ${id}`, err);
    } else {
      logger.info(`about_me content deleted with ID: ${id}`);
    }
    callback(err);
  });
  stmt.finalize();
};

const getAllAboutMe = (callback) => {
  logger.info('Fetching all about_me content');
  db.all("SELECT * FROM about_me WHERE deleted_at IS NULL", (err, rows) => {
    if (err) {
      logger.error('Error fetching all about_me content', err);
    }
    callback(err, rows);
  });
};

module.exports = {
  getAboutMeById,
  createAboutMe,
  updateAboutMe,
  deleteAboutMe,
  getAllAboutMe,
  getLatestAboutMe
};
