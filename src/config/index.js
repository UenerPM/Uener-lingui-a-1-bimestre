require('dotenv').config();
const pool = require('./db');

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'segredo-uener-desenvolvimento-2025',
  pool
};
