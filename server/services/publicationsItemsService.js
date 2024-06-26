const { getItemById, updateItem, createItem, getAllItems, getItemsByCategoryId, deleteItem } = require('../models/publications_itemsModel');
const logger = require('../logger'); // 引入日志记录器
const _ = require('lodash');
const { handleImages } = require('./utilsService');

const getItem = async (id) => {
  return new Promise((resolve, reject) => {
    getItemById(id, (err, item) => {
      if (err) {
        logger.error(`Error fetching item by ID: ${id}`, err);
        reject(err);
      } else {
        resolve(item);
      }
    });
  });
};

const saveItem = async (id, categoryId, content) => {
  return new Promise((resolve, reject) => {
    getItemById(id, (err, existingItem) => {
      if (err) {
        logger.error(`Error fetching item by ID: ${id}`, err);
        reject(err);
      } else if (existingItem) {
        updateItem(id, categoryId, content, (err) => {
          if (err) {
            logger.error(`Error updating item by ID: ${id}`, err);
            reject(err);
          } else {
            resolve({ success: true, message: 'Item updated successfully!' });
          }
        });
      } else {
        createItem(categoryId, content, (err, newId) => {
          if (err) {
            logger.error('Error creating item', err);
            reject(err);
          } else {
            resolve({ success: true, message: 'Item created successfully!', id: newId });
          }
        });
      }
    });
  });
};

const getAllItemsService = async () => {
  return new Promise((resolve, reject) => {
    getAllItems((err, items) => {
      if (err) {
        logger.error('Error fetching all items', err);
        reject(err);
      } else {
        resolve(items);
      }
    });
  });
};

const getItemsByCategoryIdService = async (categoryId) => {
  return new Promise((resolve, reject) => {
    getItemsByCategoryId(categoryId, (err, items) => {
      if (err) {
        logger.error(`Error fetching items by category ID: ${categoryId}`, err);
        reject(err);
      } else {
        resolve(items);
      }
    });
  });
};

const batchUpdateItems = async (updates, deletions, creations, categoryIdMap, req) => {
  const handleUpdates = async (item) => {
    const existingItem = await new Promise((resolve, reject) => {
      getItemById(item.id, (err, result) => {
        if (err) {
          logger.error(`Error fetching item by ID: ${item.id}`, err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    let oldContent = {};
    const newContent = _.cloneDeep(item.content);
    
   
    if (existingItem.content) {
      try {
        oldContent = JSON.parse(existingItem.content);
      } catch (error) {
        logger.error('Error parsing existingItem.content:', error);
        throw error;
      }
    }

    newContent.image = await handleImages(
      newContent.image,
      oldContent ? oldContent.image : null,
      req,
      './uploads/images/publications'
    );

    return new Promise((resolve, reject) => {
      updateItem(item.id, item.category_id, newContent, (err) => {
        if (err) {
          logger.error(`Error updating item by ID: ${item.id}`, err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };

  const handleDeletions = async (itemId) => {
    const existingItem = await new Promise((resolve, reject) => {
      getItemById(itemId, (err, result) => {
        if (err) {
          logger.error(`Error fetching item by ID: ${itemId}`, err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
    let oldContent = {};
    if (existingItem.content) {
      try {
        oldContent = JSON.parse(existingItem.content);
      } catch (error) {
        logger.error('Error parsing existingItem.content:', error);
        throw error;
      }
    }

    if (oldContent&& oldContent.image) {
      await handleImages(
        null,
        oldContent.image,
        req,
        './uploads/images/publications'
      );
  
    }
    
    return new Promise((resolve, reject) => {
      deleteItem(itemId, (err) => {
        if (err) {
          logger.error(`Error deleting item by ID: ${itemId}`, err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };

  const handleCreations = async (item) => {
    const categoryId = categoryIdMap[item.category_id] || item.category_id;

    let newContent = _.cloneDeep(item.content);

    if (newContent.image !== undefined) {
      newContent.image = await handleImages(
        newContent.image,
        null,
        req,
        './uploads/images/publications'
      );
    }

    return new Promise((resolve, reject) => {
      createItem(categoryId, newContent, (err) => {
        if (err) {
          logger.error('Error creating item', err);
          reject(err);
        } else {
          resolve();
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
    .then(() => resolve({ updates: updates.length, deletions: deletions.length, creations: creations.length }))
    .catch(err => {
      logger.error('Batch update failed', err);
      reject(err);
    });
  });
};


module.exports = {
  getItem,
  saveItem,
  getAllItemsService,
  getItemsByCategoryIdService,
  batchUpdateItems
};
