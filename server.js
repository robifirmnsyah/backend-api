const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');  // Mengimpor cors
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Untuk JWT
const crypto = require('crypto');
const SECRET_KEY = 'A1b2C3d4E5f6G7h8I9J0kLmNoPqRsTuVwXyZ1234567890!@#$%^&*()';
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

// Konfigurasi Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express API Documentation',
      version: '1.0.0',
      description: 'Dokumentasi API untuk backend Express menggunakan Swagger',
    },
    servers: [
      {
        url: 'http://localhost:3000', // Ganti sesuai dengan URL server Anda
      },
    ],
  },
  apis: ['./routes/*.js', './index.js'], // Sesuaikan dengan lokasi file endpoint Anda
};

// Inisialisasi Swagger
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Tambahkan middleware Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Log lokasi dokumentasi API
console.log('API documentation available at http://localhost:3000/api-docs');

// Menyediakan CORS agar frontend yang berada di port 3001 bisa mengakses API
app.use(cors({
  origin: '*',  // Mengizinkan semua origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Metode yang diizinkan
  allowedHeaders: ['Content-Type'],  // Header yang diizinkan
}));

app.use(bodyParser.json());

// Koneksi MySQL
const db = mysql.createConnection({
  // host: '10.7.90.42',
  host: 'localhost',
  user: 'admin',
  // password: 'my-secret-pw',
  password: 'admin123',
  database: 'support_ticket_db'
});

// Cek koneksi ke MySQL
db.connect(err => {
  if (err) throw err;
  console.log('MySQL connected...');
}); // Untuk hashing password

// Helper function untuk membuat ID unik
function generateUniqueId(prefix) {
  const randomString = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `${prefix}-${randomString}`;
}

// Endpoint untuk login pengguna
app.post('/api/users/login', (req, res) => {
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
      // Verifikasi password dengan bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Membuat token JWT
      const token = jwt.sign(
        {
          id_user: user.id_user,
          username: user.username,
          role: user.role
        },
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

// Endpoint untuk membuat pengguna baru (Register)
app.post('/api/users', async (req, res) => {
  const { full_name, username, password, company_id } = req.body;

  if (!full_name || !username || !password || !company_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id_user = generateUniqueId('USER');
  const role = 'Customer';

  try {
    // Cek apakah company_id valid dan ambil data terkait dari tabel customers
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

      // Hash password sebelum menyimpan
      const hashedPassword = await bcrypt.hash(password, 10);

      // Simpan data user ke tabel users
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
app.get('/api/users', (req, res) => {
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
app.get('/api/users/:id', (req, res) => {
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
app.put('/api/users/:id', async (req, res) => {
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
app.delete('/api/users/:id', (req, res) => {
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

// Endpoint untuk menambahkan customer baru
app.post('/api/customers', (req, res) => {
  const { company_name, billing_id } = req.body;

  if (!company_name || !billing_id) {
    return res.status(400).json({ error: 'Company name and billing ID are required' });
  }

  const company_id = `COMP-${crypto.randomInt(10000, 99999)}`; // Generate company_id unik

  const query = 'INSERT INTO customers (company_id, company_name, billing_id) VALUES (?, ?, ?)';
  db.query(query, [company_id, company_name, billing_id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'Customer created successfully', company_id });
  });
});

// Endpoint untuk mendapatkan semua customers
app.get('/api/customers', (req, res) => {
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
app.get('/api/customers/:company_id', (req, res) => {
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
app.put('/api/customers/:company_id', (req, res) => {
  const { company_id } = req.params;
  const { company_name, billing_id } = req.body;

  if (!company_name || !billing_id) {
    return res.status(400).json({ error: 'Company name and billing ID are required' });
  }

  const query = 'UPDATE customers SET company_name = ?, billing_id = ? WHERE company_id = ?';
  db.query(query, [company_name, billing_id, company_id], (err, result) => {
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
app.delete('/api/customers/:company_id', (req, res) => {
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
app.get('/api/tickets/:company_id', (req, res) => {
  const ticketId = req.params.company_id;
  const query = 'SELECT * FROM tickets WHERE company_id = ?';
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
app.delete('/api/tickets/:company_id', (req, res) => {
  const ticketId = req.params.company_id;
  const query = 'DELETE FROM tickets WHERE company_id = ?';

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
app.put('/api/tickets/:company_id', (req, res) => {
  const ticketId = req.params.company_id;
  const { company_id, company_name, product_list, describe_issue, detail_issue, priority, contact } = req.body;

  const query = `
    UPDATE tickets SET 
      company_id = ?, 
      company_name = ?, 
      product_list = ?, 
      describe_issue = ?, 
      detail_issue = ?, 
      priority = ?,
      contact = ? 
    WHERE company_id = ?
  `;

  db.query(
    query, 
    [company_id, company_name, product_list, describe_issue, detail_issue, priority, contact, ticketId], 
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

// Endpoint untuk mendapatkan semua layanan (services)
app.get('/api/services', (req, res) => {
  const query = 'SELECT * FROM services';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Backend running on port 3000 global');
});