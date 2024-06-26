const db = require('../db');
const logger = require('../logger'); // 引入日志记录器

const getItemById = (id, callback) => {
  logger.info(`Fetching item by ID: ${id}`);
  db.get("SELECT * FROM publications_items WHERE id = ? AND deleted_at IS NULL", [id], (err, row) => {
    if (err) {
      logger.error(`Error fetching item by ID: ${id}`, err);
    }
    callback(err, row);
  });
};

const createItem = (categoryId, content, callback) => {
  logger.info('Creating item');
  const stmt = db.prepare("INSERT INTO publications_items (category_id, content) VALUES (?, ?)");
  stmt.run(categoryId, JSON.stringify(content), function (err) {
    if (err) {
      logger.error('Error creating item', err);
    } else {
      logger.info(`Item created with ID: ${this.lastID}`);
    }
    callback(err, this.lastID);
  });
  stmt.finalize();
};

const updateItem = (id, categoryId, content, callback) => {
  logger.info(`Updating item by ID: ${id}`);
  const stmt = db.prepare("UPDATE publications_items SET category_id = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
  stmt.run(categoryId, JSON.stringify(content), id, function (err) {
    if (err) {
      logger.error(`Error updating item by ID: ${id}`, err);
    } else {
      logger.info(`Item updated with ID: ${id}`);
    }
    callback(err);
  });
  stmt.finalize();
};

const deleteItem = (id, callback) => {
  logger.info(`Deleting item by ID: ${id}`);
  const stmt = db.prepare("UPDATE publications_items SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?");
  stmt.run(id, function (err) {
    if (err) {
      logger.error(`Error deleting item by ID: ${id}`, err);
    } else {
      logger.info(`Item deleted with ID: ${id}`);
    }
    callback(err);
  });
  stmt.finalize();
};

const getAllItems = (callback) => {
  logger.info('Fetching all items');
  db.all("SELECT * FROM publications_items WHERE deleted_at IS NULL", (err, rows) => {
    if (err) {
      logger.error('Error fetching all items', err);
    }
    callback(err, rows);
  });
};

const getItemsByCategoryId = (categoryId, callback) => {
  logger.info(`Fetching items by category ID: ${categoryId}`);
  db.all("SELECT * FROM publications_items WHERE category_id = ? AND deleted_at IS NULL", [categoryId], (err, rows) => {
    if (err) {
      logger.error(`Error fetching items by category ID: ${categoryId}`, err);
    }
    callback(err, rows);
  });
};

module.exports = {
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getAllItems,
  getItemsByCategoryId
};
