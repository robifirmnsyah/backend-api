const express = require('express');
const db = require('../db'); // Koneksi database
const router = express.Router();

// Endpoint untuk mendapatkan semua layanan (services)
router.get('/', (req, res) => {
  const query = 'SELECT * FROM services';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err); // Log error ke konsol untuk debugging
      return res.status(500).json({ 
        error: 'Database error', 
        details: err.message 
      });
    }

    // Jika tidak ada layanan ditemukan
    if (results.rows.length === 0) {
      return res.status(404).json({ 
        message: 'No services found' 
      });
    }

    res.status(200).json({ 
      message: 'Services retrieved successfully', 
      data: results.rows 
    });
  });
});

module.exports = router;
