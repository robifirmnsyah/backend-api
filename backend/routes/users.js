const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Koneksi database
const { generateUniqueId } = require('../helpers/helpers'); // Fungsi helper
const router = express.Router();
const SECRET_KEY = 'A1b2C3d4E5f6G7h8I9J0kLmNoPqRsTuVwXyZ1234567890!@#$%^&*()';

// Endpoint untuk login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], async (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = results[0];
    
    try {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const token = jwt.sign(
        { id_user: user.id_user, username: user.username, role: user.role },
        SECRET_KEY,
        { expiresIn: '2h' } // Token berlaku selama 2 jam
      );

      res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Error processing request' });
    }
  });
});

// Endpoint untuk register pengguna baru
router.post('/', async (req, res) => {
  const { full_name, username, password, company_id } = req.body;

  if (!full_name || !username || !password || !company_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id_user = generateUniqueId('USER');
  const role = 'Customer';

  try {
    const companyQuery = 'SELECT company_name, billing_id FROM customers WHERE company_id = ?';
    db.query(companyQuery, [company_id], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Company not found' });
      }

      const { company_name, billing_id } = results[0];

      const hashedPassword = await bcrypt.hash(password, 10);

      const userQuery = `
        INSERT INTO users (id_user, role, full_name, username, password, company_id, company_name, billing_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(
        userQuery,
        [id_user, role, full_name, username, hashedPassword, company_id, company_name, billing_id],
        (err, result) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          res.status(201).json({ message: 'User registered successfully', id_user });
        }
      );
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ error: 'Error processing request' });
  }
});

// Endpoint untuk mendapatkan semua pengguna
router.get('/', (req, res) => {
  const query = 'SELECT id_user, role, full_name, username, company_id, company_name, billing_id FROM users';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});

// Endpoint untuk mendapatkan pengguna berdasarkan ID
router.get('/:id', (req, res) => {
  const id_user = req.params.id;
  const query = 'SELECT id_user, role, full_name, username, company_id, company_name, billing_id FROM users WHERE id_user = ?';
  db.query(query, [id_user], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(result[0]);
  });
});

// Endpoint untuk mengupdate pengguna
router.put('/:id', async (req, res) => {
  const id_user = req.params.id;
  const { full_name, username, password, company_id, company_name, billing_id, role } = req.body;

  try {
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const query = `
      UPDATE users SET 
        full_name = ?, 
        username = ?, 
        ${password ? 'password = ?,' : ''} 
        company_id = ?, 
        company_name = ?, 
        billing_id = ?, 
        role = ? 
      WHERE id_user = ?
    `;
    const params = password
      ? [full_name, username, hashedPassword, company_id, company_name, billing_id, role, id_user]
      : [full_name, username, company_id, company_name, billing_id, role, id_user];

    db.query(query, params, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ message: 'User updated successfully' });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ error: 'Error processing request' });
  }
});

// Endpoint untuk menghapus pengguna
router.delete('/:id', (req, res) => {
  const id_user = req.params.id;
  const query = 'DELETE FROM users WHERE id_user = ?';

  db.query(query, [id_user], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  });
});

module.exports = router;
