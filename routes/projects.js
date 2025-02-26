const express = require('express');
const db = require('../db'); // Koneksi database
const crypto = require('crypto');
const router = express.Router();

// Endpoint untuk menambahkan project baru
router.post('/', (req, res) => {
  const { project_name, company_id } = req.body;

  if (!project_name || !company_id) {
    return res.status(400).json({ error: 'Project name and company ID are required' });
  }

  const billingQuery = 'SELECT billing_id FROM customers WHERE company_id = $1';
  db.query(billingQuery, [company_id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const billing_id = result.rows[0].billing_id;
    const project_id = `PRJ-${crypto.randomInt(10000, 99999)}`; // Generate project_id unik
    const query = 'INSERT INTO projects (project_id, project_name, billing_id, company_id) VALUES ($1, $2, $3, $4)';
    db.query(query, [
      project_id,
      project_name,
      billing_id,
      company_id
    ], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ message: 'Project created successfully', project_id });
    });
  });
});

// Endpoint untuk mendapatkan semua projects
router.get('/', (req, res) => {
  const query = 'SELECT * FROM projects';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results.rows);
  });
});

// Endpoint untuk mendapatkan project berdasarkan project_id
router.get('/:project_id', (req, res) => {
  const { project_id } = req.params; // Ambil parameter dari URL

  const query = 'SELECT * FROM projects WHERE project_id = $1';
  db.query(query, [project_id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json(results.rows[0]); // Mengembalikan data project pertama
  });
});

// Endpoint untuk memperbarui project berdasarkan project_id
router.put('/:project_id', (req, res) => {
  const { project_id } = req.params;
  const { project_name, company_id } = req.body;

  // Validasi input agar semua kolom wajib diisi
  if (!project_name || !company_id) {
    return res.status(400).json({ error: 'Project name and company ID are required' });
  }

  const billingQuery = 'SELECT billing_id FROM customers WHERE company_id = $1';
  db.query(billingQuery, [company_id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const billing_id = result.rows[0].billing_id;
    const query = `
      UPDATE projects 
      SET project_name = $1, billing_id = $2, company_id = $3 
      WHERE project_id = $4
    `;

    db.query(query, [project_name, billing_id, company_id, project_id], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.status(200).json({ message: 'Project updated successfully' });
    });
  });
});

// Endpoint untuk menghapus project berdasarkan project_id
router.delete('/:project_id', (req, res) => {
  const { project_id } = req.params;

  const query = 'DELETE FROM projects WHERE project_id = $1';
  db.query(query, [project_id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json({ message: 'Project deleted successfully' });
  });
});

module.exports = router;