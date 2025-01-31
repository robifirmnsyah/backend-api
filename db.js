const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'magna',
  password: 'M@gn@123',
  port: 5432, // PostgreSQL default port
  database: 'support_ticket_db',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
