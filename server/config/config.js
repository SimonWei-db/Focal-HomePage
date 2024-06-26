require('dotenv').config(); // 加载环境变量

module.exports = {
  database: {
    filename: './focal_database.sqlite',
    memory: false, // 设置为 true 时使用内存数据库
  },
  bcrypt: {
    saltRounds: 10,
  },
  jwt: {
    secret: process.env.JWT_SECRET, // JWT 密钥，在环境变量中
    expiresIn: '1h', // token 有效期
  },
};
