const db = require('../db');
const logger = require('../logger'); // 引入日志记录器

const getTeamById = (id, callback) => {
  logger.info(`Fetching team content by ID: ${id}`);
  db.get("SELECT * FROM team WHERE id = ? AND deleted_at IS NULL", [id], (err, row) => {
    if (err) {
      logger.error(`Error fetching team content by ID: ${id}`, err);
    }
    callback(err, row);
  });
};

const getLatestTeam = (callback) => {
  logger.info('Fetching latest team content');
  db.get("SELECT * FROM team WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 1", (err, row) => {
    if (err) {
      logger.error('Error fetching latest team content', err);
    }
    callback(err, row);
  });
};

const createTeam = (content, callback) => {
  logger.info(`Creating team content`);
  const stmt = db.prepare("INSERT INTO team (content) VALUES (?)");
  stmt.run(JSON.stringify(content), function (err) {
    if (err) {
      logger.error('Error creating team content', err);
    } else {
      logger.info(`team content created with ID: ${this.lastID}`);
    }
    callback(err, this.lastID);
  });
  stmt.finalize();
};

const updateTeam = (id, content, callback) => {
  logger.info(`Updating team content by ID: ${id}`);
  const stmt = db.prepare("UPDATE team SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
  stmt.run(JSON.stringify(content), id, function (err) {
    if (err) {
      logger.error(`Error updating team content by ID: ${id}`, err);
    } else {
      logger.info(`team content updated with ID: ${id}`);
    }
    callback(err);
  });
  stmt.finalize();
};

const deleteTeam = (id, callback) => {
  logger.info(`Deleting team content by ID: ${id}`);
  const stmt = db.prepare("UPDATE team SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?");
  stmt.run(id, function (err) {
    if (err) {
      logger.error(`Error deleting team content by ID: ${id}`, err);
    } else {
      logger.info(`team content deleted with ID: ${id}`);
    }
    callback(err);
  });
  stmt.finalize();
};

const getAllTeam = (callback) => {
  logger.info('Fetching all team content');
  db.all("SELECT * FROM team WHERE deleted_at IS NULL", (err, rows) => {
    if (err) {
      logger.error('Error fetching all team content', err);
    }
    callback(err, rows);
  });
};

module.exports = {
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getAllTeam,
  getLatestTeam
};
