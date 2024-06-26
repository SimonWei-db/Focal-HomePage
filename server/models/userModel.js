const db = require('../db');
const logger = require('../logger'); // 引入日志记录器

const getUserByUsername = (username, callback) => {
  logger.info(`Fetching user by username: ${username}`);
  db.get("SELECT * FROM users WHERE username = ? AND deleted_at IS NULL", [username], (err, row) => {
    if (err) {
      logger.error(`Error fetching user by username: ${username}`, err);
    }
    callback(err, row);
  });
};

const updateUserPassword = (id, password, callback) => {
  logger.info(`Updating password for user by ID: ${id}`);
  const stmt = db.prepare("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
  stmt.run(password, id, function (err) {
    if (err) {
      logger.error(`Error updating password for user by ID: ${id}`, err);
    } else {
      logger.info(`Password updated for user with ID: ${id}`);
    }
    callback(err);
  });
  stmt.finalize();
};

const createUser = (username, password, callback) => {
  logger.info(`Creating user with username: ${username}`);
  const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
  stmt.run(username, password, function (err) {
    if (err) {
      logger.error(`Error creating user with username: ${username}`, err);
    } else {
      logger.info(`User created with username: ${username}, ID: ${this.lastID}`);
    }
    callback(err, this.lastID);
  });
  stmt.finalize();
};

const getAllUsers = (callback) => {
  logger.info('Fetching all users');
  db.all("SELECT * FROM users WHERE deleted_at IS NULL", (err, rows) => {
    if (err) {
      logger.error('Error fetching all users', err);
    }
    callback(err, rows);
  });
};

const getUserById = (id, callback) => {
  logger.info(`Fetching user by ID: ${id}`);
  db.get("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL", [id], (err, row) => {
    if (err) {
      logger.error(`Error fetching user by ID: ${id}`, err);
    }
    callback(err, row);
  });
};

const updateUser = (id, username, password, callback) => {
  logger.info(`Updating user by ID: ${id}`);
  const stmt = db.prepare("UPDATE users SET username = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
  stmt.run(username, password, id, function (err) {
    if (err) {
      logger.error(`Error updating user by ID: ${id}`, err);
    } else {
      logger.info(`User updated with ID: ${id}`);
    }
    callback(err);
  });
  stmt.finalize();
};

const deleteUser = (id, callback) => {
  logger.info(`Deleting user by ID: ${id}`);
  const stmt = db.prepare("UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?");
  stmt.run(id, function (err) {
    if (err) {
      logger.error(`Error deleting user by ID: ${id}`, err);
    } else {
      logger.info(`User deleted with ID: ${id}`);
    }
    callback(err);
  });
  stmt.finalize();
};

module.exports = {
  getUserByUsername,
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserPassword
};
