const express = require('express');
const multer = require('multer');
const path = require('path');
const { Storage } = require('@google-cloud/storage'); // Import Google Cloud Storage
const db = require('../db');
const { sendTicketEmail } = require('./emailService');
const router = express.Router();

// Inisialisasi Google Cloud Storage
const storage = new Storage({
  keyFilename: path.join(__dirname, './dev-robifirmansyah-f37670e6df3e.json') // Ganti dengan path ke Service Account Key
});
const bucket = storage.bucket('bucket-image-ticket'); // Ganti dengan nama bucket Anda

// Konfigurasi multer untuk menyimpan file langsung ke Cloud Storage
const multerStorage = multer.memoryStorage(); // Menggunakan memoryStorage untuk upload langsung ke GCS
const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Membatasi ukuran file maksimal 10MB
});

// Fungsi untuk menghasilkan ticket_id
const generateTicketId = () => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TICKET-${timestamp}-${randomString}`;
};

// Endpoint untuk membuat tiket baru
router.post('/', upload.single('attachment'), (req, res) => {
  console.log('File:', req.file);
  console.log('Request Body:', req.body);

  const {
    company_id,
    product_list,
    describe_issue,
    detail_issue,
    priority,
    contact,
    id_user  
  } = req.body;

  if (
    !company_id ||
    !product_list ||
    !describe_issue ||
    !detail_issue ||
    !priority ||
    !contact ||
    !id_user 
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Query untuk mendapatkan informasi perusahaan termasuk limit tiket
  const companyQuery = `
    SELECT company_name, limit_ticket 
    FROM customers 
    WHERE company_id = ?
  `;
  
  db.query(companyQuery, [company_id], (err, companyResult) => {
    if (err) {
      console.error('Database error (company query):', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (companyResult.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const { company_name, limit_ticket } = companyResult[0];

    // Query untuk menghitung jumlah tiket aktif dari perusahaan ini
    const ticketCountQuery = `
      SELECT COUNT(*) AS ticket_count 
      FROM tickets 
      WHERE company_id = ?
    `;
    
    db.query(ticketCountQuery, [company_id], (err, ticketResult) => {
      if (err) {
        console.error('Database error (ticket count query):', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const ticketCount = ticketResult[0].ticket_count;

      // Validasi: Cek apakah jumlah tiket melebihi limit
      if (ticketCount >= limit_ticket) {
        return res.status(403).json({ error: 'Ticket limit reached for this company' });
      }

      // Proses selanjutnya sama seperti kode sebelumnya (upload dan simpan tiket)
      const attachment = req.file ? req.file : null;
      const ticketId = generateTicketId();
      const status = 'Open';

      if (attachment) {
        // Proses upload file ke Google Cloud Storage
        const blob = bucket.file(Date.now() + path.extname(attachment.originalname));
        const blobStream = blob.createWriteStream({
          resumable: false,
          contentType: attachment.mimetype,
        });

        blobStream.on('error', (err) => {
          console.error('Error uploading file:', err);
          return res.status(500).json({ error: 'Error uploading file to cloud storage' });
        });

        blobStream.on('finish', async () => {
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
          saveTicketToDB(publicUrl); // Fungsi untuk menyimpan tiket di database
        });

        blobStream.end(attachment.buffer); // Mulai mengupload file
      } else {
        saveTicketToDB(null); // Simpan tiket tanpa attachment
      }

      function saveTicketToDB(attachmentUrl) {
        const ticketQuery = `
          INSERT INTO tickets (
            ticket_id, product_list, describe_issue, detail_issue, priority, 
            contact, company_id, company_name, attachment, id_user, status
          ) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
          ticketQuery,
          [
            ticketId,
            product_list,
            describe_issue,
            detail_issue,
            priority,
            contact,
            company_id,
            company_name,
            attachmentUrl,
            id_user,
            status
          ],
          async (err, result) => {
            if (err) {
              console.error('Database error (ticket query):', err);
              return res.status(500).json({ error: 'Database error' });
            }

            // Kirim email setelah tiket berhasil dibuat
            const ticketData = {
              ticket_id: ticketId,
              product_list,
              describe_issue,
              detail_issue,
              priority,
              contact,
              company_name,
              status
            };

            try {
              await sendTicketEmail(ticketData, id_user);
              console.log('Email notification sent to user!');
            } catch (emailError) {
              console.error('Error sending email notification:', emailError);
            }

            res.status(201).json({ message: 'Ticket created successfully', ticketId });
          }
        );
      }
    });
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

// Endpoint untuk mengambil tiket berdasarkan id_user dan role
router.get('/user/:id_user', (req, res) => {
  const { id_user } = req.params;

  // Query untuk mendapatkan data pengguna berdasarkan id_user
  const userQuery = 'SELECT role, company_id FROM users WHERE id_user = ?';

  db.query(userQuery, [id_user], (err, userResult) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0]; // Ambil data user (role dan company_id)
    const { role, company_id } = user;

    // Logika berdasarkan role pengguna
    let ticketQuery;
    let queryParams = [];

    if (role === 'Admin') {
      // Admin dapat melihat semua tiket
      ticketQuery = 'SELECT * FROM tickets';
    } else if (role === 'Customer Admin' || role === 'Customer') {
      // Admin Customer dan Customer hanya melihat tiket berdasarkan company_id mereka
      ticketQuery = 'SELECT * FROM tickets WHERE company_id = ?';
      queryParams = [company_id];
    } else {
      // Role tidak dikenali
      return res.status(403).json({ error: 'Access denied' });
    }

    // Jalankan query tiket
    db.query(ticketQuery, queryParams, (err, tickets) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(200).json(tickets);
    });
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

// Endpoint untuk mengedit tiket berdasarkan ID
router.put('/:ticket_id', async (req, res) => {
  const ticketId = req.params.ticket_id;
  const { 
    company_id, 
    company_name, 
    product_list, 
    describe_issue, 
    detail_issue, 
    priority, 
    contact, 
    status 
  } = req.body;

  // Validasi input wajib
  if (
    !company_id || 
    !company_name || 
    !product_list || 
    !describe_issue || 
    !detail_issue || 
    !priority || 
    !contact || 
    !status
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validasi status (misalnya: Open, In Progress, Closed)
  const validStatuses = ['Open', 'In Progress', 'Closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    // Query untuk mengupdate tiket
    const query = `
      UPDATE tickets SET 
        company_id = ?, 
        company_name = ?, 
        product_list = ?, 
        describe_issue = ?, 
        detail_issue = ?, 
        priority = ?, 
        contact = ?, 
        status = ? 
      WHERE ticket_id = ?
    `;

    const [result] = await db.promise().query(query, [
      company_id, 
      company_name, 
      product_list, 
      describe_issue, 
      detail_issue, 
      priority, 
      contact, 
      status, 
      ticketId
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.status(200).json({ message: 'Ticket updated successfully' });
  } catch (err) {
    console.error('Database error (update query):', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// Endpoint untuk menghapus tiket beserta komentar terkait berdasarkan ticket_id
router.delete('/:ticket_id', (req, res) => {
  const ticketId = req.params.ticket_id;

  // Query untuk menghapus komentar terkait dari tabel ticket_comments
  const deleteCommentsQuery = 'DELETE FROM ticket_comments WHERE ticket_id = ?';

  db.query(deleteCommentsQuery, [ticketId], (err, result) => {
    if (err) {
      console.error('Database error (delete comments):', err);
      return res.status(500).json({ error: 'Database error while deleting comments' });
    }

    // Setelah komentar dihapus, hapus tiket dari tabel tickets
    const deleteTicketQuery = 'DELETE FROM tickets WHERE ticket_id = ?';
    
    db.query(deleteTicketQuery, [ticketId], (err, result) => {
      if (err) {
        console.error('Database error (delete ticket):', err);
        return res.status(500).json({ error: 'Database error while deleting ticket' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      res.status(200).json({ message: 'Ticket and related comments deleted successfully' });
    });
  });
});


// Endpoint untuk POST komentar
router.post('/comment/:ticket_id', (req, res) => {
  const ticketId = req.params.ticket_id;
  const { id_user, comment } = req.body;

  // Validasi input
  if (!id_user || !comment) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const query = `
    INSERT INTO ticket_comments (ticket_id, id_user, comment)
    VALUES (?, ?, ?)
  `;

  db.query(query, [ticketId, id_user, comment], (err, result) => {
    if (err) {
      console.error('Database error (comment insert):', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'Comment added successfully' });
  });
});

router.get('/comment/:ticket_id', (req, res) => {
  const ticketId = req.params.ticket_id;

  const query = `
    SELECT tc.ticket_id, tc.comment, u.full_name, tc.timestamp
    FROM ticket_comments tc
    JOIN users u ON tc.id_user = u.id_user
    WHERE tc.ticket_id = ?
  `;

  db.query(query, [ticketId], (err, results) => {
    if (err) {
      console.error('Database error (comment query):', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No comments found' });
    }

    res.status(200).json(results);
  });
});

module.exports = router;