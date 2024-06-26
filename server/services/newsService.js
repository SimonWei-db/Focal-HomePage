const { getNewsById, createNews, updateNews, deleteNews, getAllNews, getNewsByType } = require('../models/newsModel');
const { getLinksByNewsId, createLink, deleteLink } = require('../models/newsLinksModel');
const logger = require('../logger'); // 引入日志记录器
const { handleImages } = require('./utilsService');

const getNews = async (id) => {
  return new Promise((resolve, reject) => {
    getNewsById(id, async (err, news) => {
      if (err) {
        logger.error(`Error fetching news by ID: ${id}`, err);
        reject(err);
      } else if (news) {
        const links = await new Promise((resolve, reject) => {
          getLinksByNewsId(id, (err, links) => {
            if (err) {
              logger.error(`Error fetching links by news ID: ${id}`, err);
              reject(err);
            } else {
              resolve(links);
            }
          });
        });
        news.links = links;
        resolve(news);
      } else {
        resolve(null);
      }
    });
  });
};

const batchProcessNews = async (newsToCreate, newsToUpdate, newsToDelete, resourcesToCreate, resourcesToUpdate, resourcesToDelete, req) => {
  const createPromises = [...newsToCreate, ...resourcesToCreate].map(item => {
    return new Promise(async (resolve, reject) => {
      const { type, title, description, date, image, links } = item;
      const processedImage = await handleImages(image, null, req, './uploads/images/news&resources');
      createNews(type, title, description, date, processedImage, (err, newId) => {
        if (err) {
          logger.error(`Error creating ${type}`, err);
          reject(err);
        } else {
          if (links) {
            links.forEach(link => {
              createLink(newId, link.url, link.label, (err) => {
                if (err) {
                  logger.error('Error creating link', err);
                  reject(err);
                }
              });
            });
          }
          resolve({ success: true, message: `${type} created successfully with ID: ${newId}`, id: newId });
        }
      });
    });
  });

  const updatePromises = [...newsToUpdate, ...resourcesToUpdate].map(item => {
    return new Promise((resolve, reject) => {
      const { id, type, title, description, date, image, links } = item;
      getNewsById(id, async (err, existingItem) => {
        if (err) {
          logger.error(`Error fetching ${type} by ID: ${id}`, err);
          reject(err);
        } else if (existingItem) {
          const processedImage = await handleImages(image, existingItem.image, req, './uploads/images/news&resources');
          updateNews(id, type, title, description, date, processedImage, async (err) => {
            if (err) {
              logger.error(`Error updating ${type} by ID: ${id}`, err);
              reject(err);
            } else {
              const existingLinks = await new Promise((resolve, reject) => {
                getLinksByNewsId(id, (err, links) => {
                  if (err) {
                    logger.error(`Error fetching links by ${type} ID: ${id}`, err);
                    reject(err);
                  } else {
                    resolve(links);
                  }
                });
              });

              const linksToDelete = existingLinks.filter(el => !links.some(nl => nl.url === el.url && nl.label === el.label));
              const linksToAdd = links.filter(nl => !existingLinks.some(el => el.url === nl.url && el.label === nl.label));

              linksToDelete.forEach(link => {
                deleteLink(link.id, (err) => {
                  if (err) {
                    logger.error(`Error deleting link ID: ${link.id}`, err);
                    reject(err);
                  }
                });
              });

              linksToAdd.forEach(link => {
                createLink(id, link.url, link.label, (err) => {
                  if (err) {
                    logger.error('Error creating link', err);
                    reject(err);
                  }
                });
              });

              resolve({ success: true, message: `${type} updated successfully with ID: ${id}` });
            }
          });
        }
      });
    });
  });

  const deletePromises = [...newsToDelete, ...resourcesToDelete].map(id => {
    return new Promise((resolve, reject) => {
      getNewsById(id, async (err, existingItem) => {
        if (err) {
          logger.error(`Error fetching item by ID: ${id}`, err);
          reject(err);
        } else if (existingItem) {
          await handleImages(null, existingItem.image, req, './uploads/images/news&resources');
          deleteNews(id, (err) => {
            if (err) {
              logger.error(`Error deleting item with ID: ${id}`, err);
              reject(err);
            } else {
              resolve({ success: true, message: `Item deleted successfully with ID: ${id}` });
            }
          });
        }
      });
    });
  });

  try {
    const results = await Promise.all([...createPromises, ...updatePromises, ...deletePromises]);
    return results;
  } catch (err) {
    throw new Error(`Batch processing failed: ${err.message}`);
  }
};


const getAllNewsService = async () => {
  return new Promise((resolve, reject) => {
    getAllNews(async (err, news) => {
      if (err) {
        logger.error('Error fetching all news', err);
        reject(err);
      } else {
        const newsWithLinksPromises = news.map(async (newsItem) => {
          const links = await new Promise((resolve, reject) => {
            getLinksByNewsId(newsItem.id, (err, links) => {
              if (err) {
                logger.error(`Error fetching links for news ID: ${newsItem.id}`, err);
                reject(err);
              } else {
                resolve(links);
              }
            });
          });
          return { ...newsItem, links };
        });
        const newsWithLinks = await Promise.all(newsWithLinksPromises);
        resolve(newsWithLinks);
      }
    });
  });
};

const getNewsByTypeService = async (type) => {
  return new Promise((resolve, reject) => {
    getNewsByType(type, async (err, news) => {
      if (err) {
        logger.error(`Error fetching news by type: ${type}`, err);
        reject(err);
      } else {
        const newsWithLinksPromises = news.map(async (newsItem) => {
          const links = await new Promise((resolve, reject) => {
            getLinksByNewsId(newsItem.id, (err, links) => {
              if (err) {
                logger.error(`Error fetching links for news ID: ${newsItem.id}`, err);
                reject(err);
              } else {
                resolve(links);
              }
            });
          });
          return { ...newsItem, links };
        });
        const newsWithLinks = await Promise.all(newsWithLinksPromises);
        resolve(newsWithLinks);
      }
    });
  });
};

module.exports = {
  getNews,
  batchProcessNews,
  getAllNewsService,
  getNewsByTypeService
};
