const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');

// Promisify necessary functions
const readFile = promisify(fs.readFile);

async function createInitialPagesData(db) {
  const pagesFilePath = path.join(process.cwd(), 'server/config/initData/pages.json');

  try {
    const pagesData = await readFile(pagesFilePath, 'utf8');
    const pagesArray = JSON.parse(pagesData);

    for (const page of pagesArray) {
      const param = page.param || crypto.randomBytes(32).toString('hex');
      const title = page.title;
      const content = page.content;
      const currentTime = new Date().toISOString();

      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO pages (param, title, content, updated_at)
          VALUES (?, ?, ?, ?)
        `, [param, title, content, currentTime], (err) => {
          if (err) {
            console.error('Error inserting data into pages table:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  } catch (err) {
    console.error('Error reading pages JSON file:', err);
  }
}

module.exports = {
  createInitialPagesData
};
