const express = require('express');
const db = require('../db'); // Koneksi database
const crypto = require('crypto');
const router = express.Router();

// Endpoint untuk menambahkan customer baru
router.post('/', (req, res) => {
  const { company_name, billing_id, maintenance, limit_ticket } = req.body;

  if (!company_name || !billing_id || !maintenance || limit_ticket === undefined) {
    return res.status(400).json({ error: 'Company name, billing ID, maintenance, and limit_ticket are required' });
  }

  const company_id = `COMP-${crypto.randomInt(10000, 99999)}`; // Generate company_id unik

  const query = 'INSERT INTO customers (company_id, company_name, billing_id, maintenance, limit_ticket) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [
    company_id,
    company_name,
    billing_id,
    maintenance,
    limit_ticket
  ], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'Customer created successfully', company_id });
  });
});

// Endpoint untuk mendapatkan semua customers
router.get('/', (req, res) => {
  const query = 'SELECT * FROM customers';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});

// Endpoint untuk mendapatkan customer berdasarkan company_id
router.get('/:company_id', (req, res) => {
  const { company_id } = req.params; // Ambil parameter dari URL

  const query = 'SELECT * FROM customers WHERE company_id = ?';
  db.query(query, [company_id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json(results[0]); // Mengembalikan data pelanggan pertama
  });
});

// Endpoint untuk memperbarui customer berdasarkan company_id
router.put('/:company_id', (req, res) => {
  const { company_id } = req.params;
  const { company_name, billing_id, maintenance, limit_ticket } = req.body;

  // Validasi input agar semua kolom wajib diisi
  if (!company_name || !billing_id || !maintenance || limit_ticket === undefined) {
    return res.status(400).json({ error: 'Company name, billing ID, maintenance, and limit_ticket are required' });
  }

  const query = `
    UPDATE customers 
    SET company_name = ?, billing_id = ?, maintenance = ?, limit_ticket = ? 
    WHERE company_id = ?
  `;

  db.query(query, [company_name, billing_id, maintenance, limit_ticket, company_id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json({ message: 'Customer updated successfully' });
  });
});

// Endpoint untuk menghapus customer berdasarkan company_id
router.delete('/:company_id', (req, res) => {
  const { company_id } = req.params;

  const query = 'DELETE FROM customers WHERE company_id = ?';
  db.query(query, [company_id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json({ message: 'Customer deleted successfully' });
  });
});

module.exports = router;
