const db = require('../db');
const logger = require('../logger'); // 引入日志记录器

const getCategoryById = (id, callback) => {
  logger.info(`Fetching category by ID: ${id}`);
  db.get("SELECT * FROM publications_categories WHERE id = ? AND deleted_at IS NULL", [id], (err, row) => {
    if (err) {
      logger.error(`Error fetching category by ID: ${id}`, err);
    }
    callback(err, row);
  });
};

const createCategory = (name, categoryOrder, callback) => {
  logger.info('Creating category');
  const stmt = db.prepare("INSERT INTO publications_categories (name, category_order) VALUES (?, ?)");
  stmt.run(name, categoryOrder, function (err) {
    if (err) {
      logger.error('Error creating category', err);
    } else {
      logger.info(`Category created with ID: ${this.lastID}`);
    }
    callback(err, this.lastID);
  });
  stmt.finalize();
};

const updateCategory = (id, name, categoryOrder, callback) => {
  logger.info(`Updating category by ID: ${id}`);
  const stmt = db.prepare("UPDATE publications_categories SET name = ?, category_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
  stmt.run(name, categoryOrder, id, function (err) {
    if (err) {
      logger.error(`Error updating category by ID: ${id}`, err);
    } else {
      logger.info(`Category updated with ID: ${id}`);
    }
    callback(err);
  });
  stmt.finalize();
};

const deleteCategory = (id, callback) => {
  logger.info(`Deleting category by ID: ${id}`);
  const stmt = db.prepare("UPDATE publications_categories SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?");
  stmt.run(id, function (err) {
    if (err) {
      logger.error(`Error deleting category by ID: ${id}`, err);
    } else {
      logger.info(`Category deleted with ID: ${id}`);
    }
    callback(err);
  });
  stmt.finalize();
};

const getAllCategories = (callback) => {
  logger.info('Fetching all categories');
  db.all("SELECT * FROM publications_categories WHERE deleted_at IS NULL", (err, rows) => {
    if (err) {
      logger.error('Error fetching all categories', err);
    }
    callback(err, rows);
  });
};

module.exports = {
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories
};
