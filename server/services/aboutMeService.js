const { getLatestAboutMe, createAboutMe } = require('../models/aboutMeModel');
const { handleImages } = require('./utilsService');
const logger = require('../logger'); // 引入日志记录器
const _ = require('lodash');

const getAboutMe = async (req) => {
  return new Promise((resolve, reject) => {
    getLatestAboutMe((err, aboutMe) => {
      if (err) {
        logger.error('Error fetching about_me content: %o', err);
        reject(err);
      } else {
        resolve(aboutMe);
      }
    });
  });
};


const saveAboutMe = async (content, req) => {
  try {
    const existingAboutMe = await new Promise((resolve, reject) => {
      getLatestAboutMe((err, result) => {
        if (err) {
          logger.error('Error fetching about_me content: %o', err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
    let  oldContent =  {};
    const newContent = _.cloneDeep(content);
    if (existingAboutMe.content) {
      try {
          oldContent = JSON.parse(existingAboutMe.content);
      } catch (error) {
          console.error('Error parsing existingAboutMe.content:', error);
          throw error;
      }
    }

    if(_.isEqual(oldContent, newContent)) {
      return { success: true, message: 'Content is identical to the existing content, no update necessary.' };
    }
  
    
    if (content.profile && content.profile.image !== undefined) {
      newContent.profile.image = await handleImages(
        content.profile.image,
        oldContent.profile ? oldContent.profile.image : null,
        req,
        './uploads/images/aboutMe'
      );
    }

    if (content.sections) {
      for (const [index, section] of content.sections.entries()) {
        if (section.subSection) {
          for (const [subIndex, subSection] of section.subSection.entries()) {
            if (subSection.image !== undefined) {
              newContent.sections[index].subSection[subIndex].image = await handleImages(
                subSection.image,
                oldContent.sections &&
                oldContent.sections[index] &&
                oldContent.sections[index].subSection &&
                oldContent.sections[index].subSection[subIndex]
                  ? oldContent.sections[index].subSection[subIndex].image
                  : null,
                req,
                './uploads/images/aboutMe'
              );
            }
          }
        }
      }
    }

    return new Promise((resolve, reject) => {
      createAboutMe(newContent, (err, id) => {
        if (err) {
          logger.error('Error creating about_me content: %o', err);
          reject(err);
        } else {
          resolve({ success: true, message: 'Content created successfully!', id });
        }
      });
    });
  } catch (error) {
    logger.error('Error handling images: %o', error);
    throw error;
  }
};



module.exports = {
  getAboutMe,
  saveAboutMe
};
