const db = require('../db');
const logger = require('../logger'); // 引入日志记录器

const getEmailById = (id, callback) => {
  logger.info(`Fetching email record by ID: ${id}`);
  db.get("SELECT * FROM emails WHERE id = ? AND deleted_at IS NULL", [id], (err, row) => {
    if (err) {
      logger.error(`Error fetching email record by ID: ${id}`, err);
    }
    callback(err, row);
  });
};

const createEmail = (name, email, message, ipAddress, callback) => {
  logger.info(`Creating email record`);
  const stmt = db.prepare("INSERT INTO emails (name, email, message, ip_address) VALUES (?, ?, ?, ?)");
  stmt.run(name, email, message, ipAddress, function (err) {
    if (err) {
      logger.error('Error creating email record', err);
    } else {
      logger.info(`Email record created with ID: ${this.lastID}`);
    }
    callback(err, this.lastID);
  });
  stmt.finalize();
};

const getEmailCountByIp = (ipAddress, callback) => {
  logger.info(`Fetching email count by IP: ${ipAddress}`);
  db.get(`
    SELECT COUNT(*) as count FROM emails 
    WHERE ip_address = ? AND created_at >= datetime('now', '-1 day') AND deleted_at IS NULL
  `, [ipAddress], (err, row) => {
    if (err) {
      logger.error(`Error fetching email count by IP: ${ipAddress}`, err);
    }
    callback(err, row ? row.count : 0);
  });
};

const getEmailCountByEmail = (email, callback) => {
  logger.info(`Fetching email count by email: ${email}`);
  db.get(`
    SELECT COUNT(*) as count FROM emails 
    WHERE email = ? AND created_at >= datetime('now', '-1 day') AND deleted_at IS NULL
  `, [email], (err, row) => {
    if (err) {
      logger.error(`Error fetching email count by email: ${email}`, err);
    }
    callback(err, row ? row.count : 0);
  });
};

const deleteEmail = (id, callback) => {
  logger.info(`Deleting email record by ID: ${id}`);
  const stmt = db.prepare("UPDATE emails SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?");
  stmt.run(id, function (err) {
    if (err) {
      logger.error(`Error deleting email record by ID: ${id}`, err);
    } else {
      logger.info(`Email record deleted with ID: ${id}`);
    }
    callback(err);
  });
  stmt.finalize();
};

const getAllEmails = (callback) => {
  logger.info('Fetching all email records');
  db.all("SELECT * FROM emails WHERE deleted_at IS NULL", (err, rows) => {
    if (err) {
      logger.error('Error fetching all email records', err);
    }
    callback(err, rows);
  });
};

const getTotalEmailCountToday = (callback) => {
  logger.info('Fetching total email count for today');
  db.get(`
    SELECT COUNT(*) as count FROM emails 
    WHERE created_at >= datetime('now', 'start of day') AND deleted_at IS NULL
  `, (err, row) => {
    if (err) {
      logger.error('Error fetching total email count for today', err);
    }
    callback(err, row ? row.count : 0);
  });
};

module.exports = {
  getEmailById,
  createEmail,
  getEmailCountByIp,
  getEmailCountByEmail,
  deleteEmail,
  getAllEmails,
  getTotalEmailCountToday
};
