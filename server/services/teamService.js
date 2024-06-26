const { getLatestTeam, createTeam } = require('../models/teamModel');
const logger = require('../logger'); // 引入日志记录器
const _ = require('lodash');

const getTeam = async (req) => {
  return new Promise((resolve, reject) => {
    getLatestTeam((err, team) => {
      if (err) {
        logger.error('Error fetching team content: %o', err);
        reject(err);
      } else {
        resolve(team);
      }
    });
  });
};

const saveTeam = async (content, req) => {
  try {
    const existingTeam = await new Promise((resolve, reject) => {
      getLatestTeam((err, result) => {
        if (err) {
          logger.error('Error fetching team content: %o', err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    let oldContent = {};
    const newContent = _.cloneDeep(content);
    if (existingTeam && existingTeam.content) {
      try {
        oldContent = JSON.parse(existingTeam.content);
      } catch (error) {
        console.error('Error parsing existingTeam.content:', error);
        throw error;
      }
    }

    if (_.isEqual(oldContent, newContent)) {
      return { success: true, message: 'Content is identical to the existing content, no update necessary.' };
    }

    return new Promise((resolve, reject) => {
      createTeam(newContent, (err, id) => {
        if (err) {
          logger.error('Error creating team content: %o', err);
          reject(err);
        } else {
          resolve({ success: true, message: 'Content created successfully!', id });
        }
      });
    });
  } catch (error) {
    logger.error('Error processing team content: %o', error);
    throw error;
  }
};

module.exports = {
  getTeam,
  saveTeam
};
