const mysql = require('mysql2');
const db = mysql.createConnection({
  host: '10.7.90.63',
  user: 'root',
  password: 'my-secret-pw',
  database: 'support_ticket_db',
  // host: 'localhost',
  // user: 'admin',
  // password: 'admin123',
  // database: 'support_ticket_db',
});
db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL');
});
module.exports = db;
