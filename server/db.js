const sqlite3 = require('sqlite3').verbose();
const { database } = require('./config/config');
const { createUserInitialData } = require('./config/initData/userInitData');
const { createAboutMeInitialData } = require('./config/initData/aboutMeInitData');
const { createTeamInitialData } = require('./config/initData/teamInitData');
const { createItemsInitialData, createCategoriesInitialData } = require('./config/initData/publicationsInitData');
const { createInitialNewsData } = require('./config/initData/newsInitialData');
const { createInitialPagesData } = require('./config/initData/pageContentInitData');
const logger = require('./logger');

const db = new sqlite3.Database(database.memory ? ':memory:' : database.filename);

const runQuery = (query) => {
  return new Promise((resolve, reject) => {
    db.run(query, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const getCount = (table) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });
};

const initializeTable = async (createQuery, table, initData) => {
  try {
    await runQuery(createQuery);
    const count = await getCount(table);
    if (count === 0) {
      await initData(db);
    }
  } catch (error) {
    logger.error(`Error creating or initializing ${table} table: ${error.message}`);
  }
};

const initializeDatabase = async () => {
  await initializeTable(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP
    )
  `, 'users', createUserInitialData);

  await initializeTable(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `, 'password_resets', () => Promise.resolve());

  await initializeTable(`
    CREATE TABLE IF NOT EXISTS about_me (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP
    )
  `, 'about_me', createAboutMeInitialData);

  await initializeTable(`
    CREATE TABLE IF NOT EXISTS publications_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_order INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP
    )
  `, 'publications_categories', createCategoriesInitialData);

  await initializeTable(`
    CREATE TABLE IF NOT EXISTS publications_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      content JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES publications_categories(id)
    )
  `, 'publications_items', createItemsInitialData);

  await initializeTable(`
    CREATE TABLE IF NOT EXISTS team (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP
    )
  `, 'team', createTeamInitialData);

  await initializeTable(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TIMESTAMP NOT NULL,
      image TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP
    )
  `, 'news', createInitialNewsData);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS news_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      news_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      label TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (news_id) REFERENCES news(id)
    )
  `);

  // 新建 pages 表
  await initializeTable(`
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      param TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP
    )
  `, 'pages', createInitialPagesData);

  await initializeTable(`
    CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP
    )
  `, 'emails', () => Promise.resolve());
  
};

initializeDatabase().then(() => {
  logger.info('Database initialized');
}).catch((err) => {
  logger.error('Error initializing database:', err.message);
});

module.exports = db;
