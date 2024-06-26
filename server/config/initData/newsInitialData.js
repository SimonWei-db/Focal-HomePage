const fs = require('fs');
const path = require('path');

// 从JSON文件读取并插入news表的数据
function createInitialNewsData(db) {
  const newsFilePath = path.join(process.cwd(), 'server/config/initData/news.json');
  const resourcesFilePath = path.join(process.cwd(), 'server/config/initData/resources.json');

  fs.readFile(newsFilePath, 'utf8', (err, newsData) => {
    if (err) {
      console.error('Error reading news JSON file:', err);
      return;
    }
    const newsArray = JSON.parse(newsData);
    newsArray.forEach(news => {
      const image = news.image ? news.image : null;
      db.run(`
        INSERT INTO news (type, title, description, date, image)
        VALUES (?, ?, ?, ?, ?)
      `, ['news', news.title, news.description, news.date, image], function (err) {
        if (err) {
          console.error('Error inserting data into news table:', err);
        } else {
          const newsId = this.lastID;
          news.links.forEach(link => {
            db.run(`
              INSERT INTO news_links (news_id, url, label)
              VALUES (?, ?, ?)
            `, [newsId, link.url, link.label], (err) => {
              if (err) {
                console.error('Error inserting data into news_links table:', err);
              }
            });
          });
        }
      });
    });
  });

  fs.readFile(resourcesFilePath, 'utf8', (err, resourcesData) => {
    if (err) {
      console.error('Error reading resources JSON file:', err);
      return;
    }
    const resourcesArray = JSON.parse(resourcesData);
    resourcesArray.forEach(resource => {
      const image = resource.image ? resource.image : null;
      db.run(`
        INSERT INTO news (type, title, description, date, image)
        VALUES (?, ?, ?, ?, ?)
      `, ['resource', resource.title, resource.description, resource.date, image], function (err) {
        if (err) {
          console.error('Error inserting data into news table:', err);
        } else {
          const resourceId = this.lastID;
          resource.links.forEach(link => {
            db.run(`
              INSERT INTO news_links (news_id, url, label)
              VALUES (?, ?, ?)
            `, [resourceId, link.url, link.label], (err) => {
              if (err) {
                console.error('Error inserting data into news_links table:', err);
              }
            });
          });
        }
      });
    });
  });
}

module.exports = {
  createInitialNewsData
};
