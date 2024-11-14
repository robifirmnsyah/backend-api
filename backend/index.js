const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');  // Mengimpor cors

const app = express();

// Menyediakan CORS agar frontend yang berada di port 3001 bisa mengakses API
app.use(cors({
  origin: '*',  // Mengizinkan semua origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Metode yang diizinkan
  allowedHeaders: ['Content-Type'],  // Header yang diizinkan
}));

app.use(bodyParser.json());

// Koneksi MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'admin',
  password: 'admin123',
  database: 'support_ticket_db'
});

// Cek koneksi ke MySQL
db.connect(err => {
  if (err) throw err;
  console.log('MySQL connected...');
});

// Konfigurasi multer untuk mengunggah file
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.post('/api/tickets', upload.single('attachment'), (req, res) => {
  console.log('File:', req.file); // Log untuk memastikan file diterima
  console.log('Request Body:', req.body); // Log untuk melihat data yang diterima

  // Cek apakah ada error yang spesifik saat menyimpan data ke database
  const { product_list, describe_issue, detail_issue, priority, contact } = req.body;
  if (!product_list || !describe_issue || !detail_issue || !priority || !contact) {
    console.log('Error: Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const attachment = req.file ? req.file.filename : null;

  const query = 'INSERT INTO tickets (product_list, describe_issue, detail_issue, priority, contact, attachment) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [product_list, describe_issue, detail_issue, priority, contact, attachment], (err, result) => {
    if (err) {
      console.error('Database error:', err); // Log jika ada error database
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'Ticket created successfully', ticketId: result.insertId });
  });
});

// Endpoint untuk mengambil semua tiket support
app.get('/api/tickets', (req, res) => {
  const query = 'SELECT * FROM tickets';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});

// Endpoint untuk mendapatkan tiket berdasarkan ID
app.get('/api/tickets/:id', (req, res) => {
  const ticketId = req.params.id;
  const query = 'SELECT * FROM tickets WHERE id = ?';
  db.query(query, [ticketId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(200).json(result[0]); // Mengembalikan tiket yang ditemukan
  });
});

// Endpoint untuk menghapus tiket berdasarkan ID
app.delete('/api/tickets/:id', (req, res) => {
  const ticketId = req.params.id;
  const query = 'DELETE FROM tickets WHERE id = ?';

  db.query(query, [ticketId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(200).json({ message: 'Ticket deleted successfully' });
  });
});

// Endpoint untuk mengedit tiket berdasarkan ID
app.put('/api/tickets/:id', (req, res) => {
  const ticketId = req.params.id;
  const { customer_id, customer_name, product_list, describe_issue, detail_issue, priority, contact } = req.body;

  const query = `
    UPDATE tickets SET 
      customer_id = ?, 
      customer_name = ?, 
      product_list = ?, 
      describe_issue = ?, 
      detail_issue = ?, 
      priority = ?,
      contact = ? 
    WHERE id = ?
  `;

  db.query(
    query, 
    [customer_id, customer_name, product_list, describe_issue, detail_issue, priority, contact, ticketId], 
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      res.status(200).json({ message: 'Ticket updated successfully' });
    }
  );
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Backend running on port 3000 global');
});