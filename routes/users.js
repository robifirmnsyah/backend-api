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
        email: user.email,
        phone: user.phone,
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

// Endpoint untuk register pengguna baru
router.post('/', async (req, res) => {
  const { full_name, username, password, company_id, role, email, phone } = req.body;

  // Validasi input
  if (!full_name || !username || !password || !company_id || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id_user = generateUniqueId('USER');
  const userRole = role || 'Customer';

  try {
    // Periksa apakah company_id valid
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

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Simpan pengguna ke database dengan email dan phone
      const userQuery = `
        INSERT INTO users (id_user, role, full_name, username, password, company_id, company_name, billing_id, email, phone) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(
        userQuery,
        [id_user, userRole, full_name, username, hashedPassword, company_id, company_name, billing_id, email, phone],
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
  const query = 'SELECT id_user, role, full_name, username, company_id, company_name, billing_id, email, phone FROM users';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});


router.get('/:id_user', (req, res) => {
  const id_user = req.params.id_user; // Ambil id_user dari parameter URL

  if (!id_user) {
    return res.status(400).json({ error: 'Missing required parameter: id_user' });
  }

  // Query untuk mendapatkan role dan company_id pengguna
  const userQuery = `
    SELECT role, company_id 
    FROM users 
    WHERE id_user = ?
  `;

  db.query(userQuery, [id_user], (err, userResult) => {
    if (err) {
      console.error('Database error (user query):', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { role, company_id } = userResult[0];

    // Query untuk mendapatkan data user sesuai role
    let query;
    let queryParams = [];

    if (role === 'Admin') {
      // Jika role Admin, ambil seluruh data user
      query = `
        SELECT id_user, role, full_name, username, company_id, company_name, billing_id, email, phone 
        FROM users
      `;
    } else if (role === 'Customer Admin') {
      // Jika role Customer Admin, ambil data user sesuai company_id mereka
      query = `
        SELECT id_user, role, full_name, username, company_id, company_name, billing_id, email, phone 
        FROM users
        WHERE company_id = ?
      `;
      queryParams = [company_id];
    } else {
      // Jika role lain, tidak memiliki akses
      return res.status(403).json({ error: 'You do not have access to view user data' });
    }

    // Eksekusi query untuk mendapatkan data user
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Database error (users query):', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(200).json(results);
    });
  });
});

// Endpoint untuk mendapatkan pengguna berdasarkan ID
router.get('/:id', (req, res) => {
  const id_user = req.params.id;
  const query = 'SELECT id_user, role, full_name, username, company_id, company_name, billing_id, email, phone FROM users WHERE id_user = ?';
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
  const { full_name, username, password, company_id, email, phone } = req.body;

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
        email = ?, 
        phone = ?
      WHERE id_user = ?
    `;
    const params = password
      ? [full_name, username, hashedPassword, company_id, email, phone, id_user]
      : [full_name, username, company_id, email, phone, id_user];

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

  // Hapus komentar terkait user
  const deleteCommentsQuery = `
    DELETE FROM ticket_comments 
    WHERE id_user = ?
  `;

  db.query(deleteCommentsQuery, [id_user], (err) => {
    if (err) {
      console.error('Database error (delete comments):', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Hapus user setelah komentar terkait dihapus
    const deleteUserQuery = 'DELETE FROM users WHERE id_user = ?';

    db.query(deleteUserQuery, [id_user], (err, result) => {
      if (err) {
        console.error('Database error (delete user):', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'User and related comments deleted successfully' });
    });
  });
});


module.exports = router;
