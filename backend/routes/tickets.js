const express = require('express');
const multer = require('multer');
const path = require('path'); // Import path
const db = require('../db'); // Koneksi database
const router = express.Router();

// Konfigurasi multer untuk mengunggah file
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Endpoint untuk membuat tiket baru
router.post('/', upload.single('attachment'), (req, res) => {
  console.log('File:', req.file); // Log untuk memastikan file diterima
  console.log('Request Body:', req.body); // Log untuk melihat data yang diterima

  const { product_list, describe_issue, detail_issue, priority, contact } = req.body;
  if (!product_list || !describe_issue || !detail_issue || !priority || !contact) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const attachment = req.file ? req.file.filename : null;

  const query = 'INSERT INTO tickets (product_list, describe_issue, detail_issue, priority, contact, attachment) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [product_list, describe_issue, detail_issue, priority, contact, attachment], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'Ticket created successfully', ticketId: result.insertId });
  });
});

// Endpoint untuk mengambil semua tiket support
router.get('/', (req, res) => {
  const query = 'SELECT * FROM tickets';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});

// Endpoint untuk mendapatkan tiket berdasarkan ID
router.get('/:ticket_id', (req, res) => {
  const ticketId = req.params.ticket_id;
  const query = 'SELECT * FROM tickets WHERE ticket_id = ?';
  db.query(query, [ticketId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(200).json(result[0]);
  });
});

// Endpoint untuk menghapus tiket berdasarkan ID
router.delete('/:ticket_id', (req, res) => {
  const ticketId = req.params.ticket_id;
  const query = 'DELETE FROM tickets WHERE ticket_id = ?';

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
router.put('/:ticket_id', (req, res) => {
  const ticketId = req.params.ticket_id;
  const { product_list, describe_issue, detail_issue, priority, contact } = req.body;

  const query = `
    UPDATE tickets SET 
      product_list = ?, 
      describe_issue = ?, 
      detail_issue = ?, 
      priority = ?, 
      contact = ?
    WHERE ticket_id = ?
  `;

  db.query(query, [product_list, describe_issue, detail_issue, priority, contact, ticketId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(200).json({ message: 'Ticket updated successfully' });
  });
});

module.exports = router;
