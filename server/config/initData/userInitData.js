const bcryptjs = require('bcryptjs');
const { saltRounds } = require('../config').bcrypt;

const initialUsers = [
  {
    username: 'weixingchensimon@gmail.com',
    password: 'This_is_a_Demo_Account!',
  },
  // 可以在这里添加更多初始用户
];

const createUserInitialData = async (db) => {
  for (const user of initialUsers) {
    const hashedPassword = await bcryptjs.hash(user.password, saltRounds);
    db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [user.username, hashedPassword],
      (err) => {
        if (err) {
          console.error(`Error inserting initial user ${user.username}:`, err);
        }
      }
    );
  }
};

module.exports = {
  createUserInitialData,
};
