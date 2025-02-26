const express = require('express');
const db = require('../db'); // Koneksi database
const crypto = require('crypto');
const router = express.Router();

// Endpoint untuk menambahkan group baru
router.post('/', (req, res) => {
  const { group_name, company_id } = req.body;

  if (!group_name || !company_id) {
    return res.status(400).json({ error: 'Group name and company ID are required' });
  }

  const group_id = `GRP-${crypto.randomInt(10000, 99999)}`; // Generate group_id unik

  const query = 'INSERT INTO groups (group_id, group_name, company_id) VALUES ($1, $2, $3)';
  db.query(query, [
    group_id,
    group_name,
    company_id
  ], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'Group created successfully', group_id });
  });
});

// Endpoint untuk mendapatkan semua groups
router.get('/', (req, res) => {
  const query = 'SELECT * FROM groups';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results.rows);
  });
});

// Endpoint untuk mendapatkan group berdasarkan group_id
router.get('/:group_id', (req, res) => {
  const { group_id } = req.params; // Ambil parameter dari URL

  const query = 'SELECT * FROM groups WHERE group_id = $1';
  db.query(query, [group_id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(200).json(results.rows[0]); // Mengembalikan data group pertama
  });
});

// Endpoint untuk memperbarui group berdasarkan group_id
router.put('/:group_id', (req, res) => {
  const { group_id } = req.params;
  const { group_name, company_id } = req.body;

  // Validasi input agar semua kolom wajib diisi
  if (!group_name || !company_id) {
    return res.status(400).json({ error: 'Group name and company ID are required' });
  }

  const query = `
    UPDATE groups 
    SET group_name = $1, company_id = $2 
    WHERE group_id = $3
  `;

  db.query(query, [group_name, company_id, group_id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(200).json({ message: 'Group updated successfully' });
  });
});

// Endpoint untuk menghapus group berdasarkan group_id
router.delete('/:group_id', (req, res) => {
  const { group_id } = req.params;

  const query = 'DELETE FROM groups WHERE group_id = $1';
  db.query(query, [group_id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(200).json({ message: 'Group deleted successfully' });
  });
});

// Endpoint untuk menambahkan user ke dalam group
router.post('/:group_id/users', (req, res) => {
  const { group_id } = req.params;
  const { id_user } = req.body;

  if (!group_id || !id_user) {
    return res.status(400).json({ error: 'Group ID and user ID are required' });
  }

  const query = 'INSERT INTO user_groups (id_user, group_id) VALUES ($1, $2)';
  db.query(query, [id_user, group_id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'User added to group successfully' });
  });
});

// Endpoint untuk mendapatkan semua pengguna berdasarkan group_id
router.get('/:group_id/users', (req, res) => {
  const { group_id } = req.params;

  if (!group_id) {
    return res.status(400).json({ error: 'Group ID is required' });
  }

  const query = `
    SELECT u.id_user, u.role, u.full_name, u.username, u.company_id, u.company_name, u.billing_id, u.email, u.phone 
    FROM users u
    JOIN user_groups ug ON u.id_user = ug.id_user
    WHERE ug.group_id = $1
  `;
  db.query(query, [group_id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results.rows);
  });
});

module.exports = router;