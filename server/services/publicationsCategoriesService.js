const { getCategoryById, updateCategory, createCategory, getAllCategories, deleteCategory } = require('../models/publications_categoriesModel');
const logger = require('../logger'); // 引入日志记录器

const getCategory = async (id) => {
  return new Promise((resolve, reject) => {
    getCategoryById(id, (err, category) => {
      if (err) {
        logger.error(`Error fetching category by ID: ${id}`, err);
        reject(err);
      } else {
        resolve(category);
      }
    });
  });
};

const saveCategory = async (id, name, categoryOrder) => {
  return new Promise((resolve, reject) => {
    getCategoryById(id, (err, existingCategory) => {
      if (err) {
        logger.error(`Error fetching category by ID: ${id}`, err);
        reject(err);
      } else if (existingCategory) {
        updateCategory(id, name, categoryOrder, (err) => {
          if (err) {
            logger.error(`Error updating category by ID: ${id}`, err);
            reject(err);
          } else {
            resolve({ success: true, message: 'Category updated successfully!' });
          }
        });
      } else {
        createCategory(name, categoryOrder, (err, newId) => {
          if (err) {
            logger.error('Error creating category', err);
            reject(err);
          } else {
            resolve({ success: true, message: 'Category created successfully!', id: newId });
          }
        });
      }
    });
  });
};

const getAllCategoriesService = async () => {
  return new Promise((resolve, reject) => {
    getAllCategories((err, categories) => {
      if (err) {
        logger.error('Error fetching all categories', err);
        reject(err);
      } else {
        resolve(categories);
      }
    });
  });
};

const batchUpdateCategories = async (updates, deletions, creations) => {
  const handleUpdates = (category) => {
    return new Promise((resolve, reject) => {
      updateCategory(category.id, category.name, category.category_order, (err) => {
        if (err) {
          logger.error(`Error updating category by ID: ${category.id}`, err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };

  const handleDeletions = (category) => {
    return new Promise((resolve, reject) => {
      deleteCategory(category, (err) => {
        if (err) {
          logger.error(`Error deleting category by ID: ${category.id}`, err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };

  const handleCreations = (category) => {
    return new Promise((resolve, reject) => {
      createCategory(category.name, category.category_order, (err, id) => {
        if (err) {
          logger.error('Error creating category', err);
          reject(err);
        } else {
          resolve({ tempId: category.id, newId: id });
        }
      });
    });
  };

  return new Promise((resolve, reject) => {
    Promise.all([
      ...updates.map(handleUpdates),
      ...deletions.map(handleDeletions),
      ...creations.map(handleCreations)
    ])
    .then(results => {
      const idMap = results.filter(result => result).reduce((map, obj) => {
        map[obj.tempId] = obj.newId;
        return map;
      }, {});
      resolve({ updates: updates.length, deletions: deletions.length, creations: creations.length, idMap });
    })
    .catch(err => {
      logger.error('Batch update failed', err);
      reject(err);
    });
  });
};

module.exports = {
  getCategory,
  saveCategory,
  getAllCategoriesService,
  batchUpdateCategories
};
