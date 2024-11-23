const mysql = require('mysql2');
const db = mysql.createConnection({
  // host: '10.7.90.63',
  // user: 'magna',
  // password: 'M@gn@123',
  // database: 'support_ticket_db',
  host: 'u0cc3.h.filess.io',
  user: 'MagnasightDB_campcoldso',
  password: '1a86cb347ade4fa49811969dd29bace3f61f54e0',
  port: '3307',
  database: 'MagnasightDB_campcoldso',
});
db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL');
});
module.exports = db;
