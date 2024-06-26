// routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const { getFilesWithSizes, uploadFileToDirectory } = require('../services/utilsService');
const { getNewsByTypeService } = require('../services/newsService');
const authenticateJWT = require('../middleware/authMiddleware');
const logger = require('../logger');
const fs = require('fs');
const path = require('path');
const { getAboutMe } = require('../services/aboutMeService');
const { getAllCategoriesService } = require('../services/publicationsCategoriesService');
const { getItemsByCategoryIdService } = require('../services/publicationsItemsService');
const { getTeam } = require('../services/teamService');
const { promisify } = require('util');
const copyFile = promisify(fs.copyFile);
const writeFile = promisify(fs.writeFile);
const { getAllPagesService, getPageByParamService } = require('../services/pageService');

const filesDir = path.join(process.cwd(), 'server/uploads/files');
const filesDirIsSA = path.join(process.cwd(), 'client/build/upload_files/UserCloud');

// 获取文件列表及大小
const checkDiskSpace = require('check-disk-space').default;

const getFreeSpace = async (directory) => {
  try {
    const diskSpace = await checkDiskSpace(directory);
    const freeSpace = diskSpace.free;
    return freeSpace;
  } catch (error) {
    throw new Error('Error getting free space:', error);
  }
};

router.get('/', async (req, res) => {
  try {
    const fileDetails = await getFilesWithSizes(filesDir);
    const freeSpace = await getFreeSpace(filesDir);
    const adjustedFreeSpace = freeSpace * 0.8;

    res.status(200).json({
      success: true,
      files: fileDetails,
      freeSpace: adjustedFreeSpace
    });
  } catch (err) {
    logger.error('Error getting files or free space:', err);
    res.status(500).json({
      success: false,
      message: 'Error getting files or free space.',
      error: err
    });
  }
});


// 上传文件
router.post('/upload', authenticateJWT, (req, res) => {
  uploadFileToDirectory(req, res, (result) => {
    if (result.success) {
      res.status(result.code).json({ success: true, fileUrl: result.fileUrl });
    } else {
      logger.error(result.message, result.error);
      res.status(result.code).json({ success: false, message: result.message });
    }
  });
});

// 删除文件
router.delete('/:fileName', authenticateJWT, (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(filesDir, fileName);

  fs.unlink(filePath, (err) => {
    if (err) {
      logger.error('Error deleting file:', err);
      return res.status(500).json({ success: false, message: 'Error deleting file.', error: err });
    }
    logger.info(`File deleted successfully: ${fileName}`);

    if (process.env.isSA === 'true') {
      const filePathIsSA = path.join(filesDirIsSA, fileName);

      fs.unlink(filePathIsSA, (err) => {
        if (err) {
          logger.error('Error deleting file in SA directory:', err);
          return res.status(500).json({ success: false, message: 'Error deleting file in SA directory.', error: err });
        }
        logger.info(`File deleted successfully in SA directory: ${fileName}`);
        res.status(200).json({ success: true, message: 'File deleted successfully in both directories.' });
      });
    } else {
      res.status(200).json({ success: true, message: 'File deleted successfully.' });
    }
  });
});

// Helper function to replace image paths and copy images
const processAboutMeImages = async (content, baseDir, sourcePathPrefix, targetPathPrefix) => {
  if (typeof content === 'string') {
    content = JSON.parse(content);
  }

  const replaceAndCopyImage = async (imagePath) => {
    if (imagePath.startsWith(sourcePathPrefix)) {
      const newImagePath = imagePath.replace(sourcePathPrefix, targetPathPrefix);
      const sourcePath = path.join(process.cwd(), `server/uploads/images/aboutMe${sourcePathPrefix.split('/').pop()}`, path.basename(imagePath));
      const destinationPath = path.join(baseDir, './AboutMe', path.basename(imagePath));
      await copyFile(sourcePath, destinationPath);
      return newImagePath;
    }
    return imagePath;
  };

  if (content.profile && content.profile.image) {
    content.profile.image = await replaceAndCopyImage(content.profile.image);
  }

  if (content.sections) {
    for (let section of content.sections) {
      if (section.subSection) {
        for (let subSection of section.subSection) {
          if (subSection.image) {
            subSection.image = await replaceAndCopyImage(subSection.image);
          }
        }
      }
    }
  }

  return content;
};

// Helper function to process publication items
const processPublicationItems = async (items, baseDir) => {
  for (let item of items) {
    const content = JSON.parse(item.content);
    if (content.image && content.image.startsWith('./uploads/images/publications/')) {
      const newImagePath = content.image.replace('./uploads/images/publications/', './upload_files/Publications/');
      const sourcePath = path.join(process.cwd(), 'server/uploads/images/publications', path.basename(content.image));
      const destinationPath = path.join(baseDir, 'Publications', path.basename(content.image));
      await copyFile(sourcePath, destinationPath);
      content.image = newImagePath;
      
    }
    if (content.links && Array.isArray(content.links)) {
      for (let link of content.links) {
        if (link.url && link.url.startsWith('./uploads/files')) {
          link.url = link.url.replace('./uploads/files', './upload_files/UserCloud');
        }
      }
    }
    item.content = JSON.stringify(content);
  }
  return items;
};

// Function to process AboutMe content
const processAboutMe = async (req, uploadsPath) => {
  const aboutMe = await getAboutMe(req);
  if (aboutMe) {
    const processedContent = await processAboutMeImages(JSON.parse(aboutMe.content), uploadsPath, './uploads/images/aboutMe/', './upload_files/AboutMe/');
    const aboutMePath = path.join(uploadsPath, 'AboutMe', 'aboutMe.json');
    await writeFile(aboutMePath, JSON.stringify(processedContent, null, 2));
    logger.info(`aboutMe content saved successfully: ${aboutMePath}`);
  } else {
    throw new Error('Content not found');
  }
};

// Function to process Publications content
const processPublications = async (uploadsPath) => {
  const categories = await getAllCategoriesService();
  const categoriesPath = path.join(uploadsPath, 'Publications', 'categories.json');
  await writeFile(categoriesPath, JSON.stringify(categories, null, 2));

  for (const category of categories) {
    const items = await getItemsByCategoryIdService(category.id);
    const processedItems = await processPublicationItems(items, uploadsPath);
    const itemsPath = path.join(uploadsPath, 'Publications', `category_${category.id}.json`);
    await writeFile(itemsPath, JSON.stringify(processedItems, null, 2));
    logger.info(`Category ${category.id} items saved successfully: ${itemsPath}`);
  }
};

const processTeam = async (req, uploadsPath) => {
  const team = await getTeam(req);
  const teamPath = path.join(uploadsPath, 'Team', 'team.json');
  await writeFile(teamPath, JSON.stringify(team, null, 2));
  logger.info(`Team content saved successfully: ${teamPath}`);
};

const processNewsAndResources = async (type, uploadsPath) => {
  const items = await getNewsByTypeService(type);
  for (let item of items) {
    if (item.image && item.image.startsWith('./uploads/images/news&resources/')) {
      const newImagePath = item.image.replace('./uploads/images/news&resources/', './upload_files/News&Resources/');
      const sourcePath = path.join(process.cwd(), 'server/uploads/images/news&resources', path.basename(item.image));
      const destinationPath = path.join(uploadsPath, 'News&Resources', path.basename(item.image));
      await copyFile(sourcePath, destinationPath);
      item.image = newImagePath;
    }
    if (item.links && Array.isArray(item.links)) {
      for (let link of item.links) {
        if (link.url && link.url.startsWith('./uploads/files')) {
          link.url = link.url.replace('./uploads/files', './upload_files/UserCloud');
        }
      }
    }
  }
  const filePath = path.join(uploadsPath, 'News&Resources', `${type}.json`);
  await writeFile(filePath, JSON.stringify(items, null, 2));
  logger.info(`${type} content saved successfully: ${filePath}`);
};
const copyFilesToUserCloud = async (sourceDir, targetDir) => {
  const files = await fs.promises.readdir(sourceDir);
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    await copyFile(sourcePath, targetPath);
  }
  logger.info(`Files copied successfully to ${targetDir}`);
};

const processWebPages = async (uploadsPath) => {
  const pagesRaw = await getAllPagesService();
  const pages = pagesRaw.pages
  const pagesPath = path.join(uploadsPath, 'WebPages', 'pageList.json');
  await writeFile(pagesPath, JSON.stringify({ pages }, null, 2));
  logger.info(`Pages list saved successfully: ${pagesPath}`);

  for (const pageInfo of pages) {
    const page = await getPageByParamService(pageInfo.param);
    const pagePath = path.join(uploadsPath, 'WebPages', `${pageInfo.param}.json`);
    await writeFile(pagePath, JSON.stringify(page.page, null, 2));
    logger.info(`Page ${pageInfo.param} saved successfully: ${pagePath}`);
  }
};


router.post('/web-data-export', async (req, res) => {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '').replace('T', '_').split('.')[0];
  let directoryName = `exported_files_${timestamp}`;
  let directoryPath = path.join(process.cwd(), "server", directoryName);
  let suffix = 1;

  while (fs.existsSync(directoryPath)) {
    directoryName = `result_${timestamp}_${suffix}`;
    directoryPath = path.join(process.cwd(), "server", directoryName);
    suffix++;
  }

  fs.mkdir(directoryPath, { recursive: true }, async (err) => {
    if (err) {
      logger.error('Error creating directory:', err);
      return res.status(500).json({ success: false, message: 'Error creating directory.', error: err });
    }

    const uploadsPath = path.join(directoryPath, 'upload_files');
    const subdirectories = ['AboutMe', 'News&Resources', 'Publications', 'Team', 'UserCloud', 'WebPages'];

    fs.mkdir(uploadsPath, { recursive: true }, async (err) => {
      if (err) {
        logger.error('Error creating uploads directory:', err);
        return res.status(500).json({ success: false, message: 'Error creating uploads directory.', error: err });
      }

      for (const subdir of subdirectories) {
        const subdirPath = path.join(uploadsPath, subdir);
        fs.mkdir(subdirPath, { recursive: true }, (err) => {
          if (err) {
            logger.error(`Error creating subdirectory ${subdir}:`, err);
          }
        });
      }

      try {
        await processAboutMe(req, uploadsPath);
        await processPublications(uploadsPath);
        await processTeam(req, uploadsPath); 
        await processNewsAndResources('news', uploadsPath);
        await processNewsAndResources('resource', uploadsPath);
        await copyFilesToUserCloud(filesDir, path.join(uploadsPath, 'UserCloud')); 
        await processWebPages(uploadsPath);

        logger.info(`Data exported successfully: ${directoryName}`);
        res.status(200).json({ success: true, message: `Web data export successful.`, directoryPath: directoryPath});
      } catch (err) {
        logger.error('Error processing content:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    });
  });
});
module.exports = router;
