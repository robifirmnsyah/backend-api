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

  // Validasi input
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], async (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Jika user tidak ditemukan
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = results[0];

    try {
      // Verifikasi password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id_user: user.id_user,
          username: user.username,
          role: user.role,
        },
        SECRET_KEY,
        { expiresIn: '2h' } // Token berlaku selama 2 jam
      );

      // Kirimkan informasi user tanpa password
      const userData = {
        id_user: user.id_user,
        role: user.role,
        full_name: user.full_name,
        username: user.username,
        company_id: user.company_id,
        company_name: user.company_name,
        billing_id: user.billing_id,
      };

      res.status(200).json({
        message: 'Login successful',
        token,
        user: userData, // Mengembalikan data user lengkap
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Error processing request' });
    }
  });
});

module.exports = router;
