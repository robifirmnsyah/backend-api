const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'admin',
  password: 'admin123',
  database: 'support_ticket_db',
});
db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL');
});
module.exports = db;
