const express = require('express');
const multer = require('multer');
const path = require('path');
const { Storage } = require('@google-cloud/storage'); // Import Google Cloud Storage
const db = require('../db');
const { sendTicketEmail } = require('./emailService');
const router = express.Router();

// Inisialisasi Google Cloud Storage
const storage = new Storage({
  keyFilename: path.join(__dirname, './dev-robifirmansyah-22286b9dc39d.json') // Ganti dengan path ke Service Account Key
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

router.post('/', upload.single('attachment'), (req, res) => {
  console.log('File:', req.file);
  console.log('Request Body:', req.body);

  const {
    company_id,
    product_list,
    describe_issue,
    detail_issue,
    priority,
    contact
  } = req.body;

  if (
    !company_id ||
    !product_list ||
    !describe_issue ||
    !detail_issue ||
    !priority ||
    !contact
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const attachment = req.file ? req.file : null;
  const ticketId = generateTicketId();
  const status = 'Open';

  const companyQuery = 'SELECT company_name FROM customers WHERE company_id = ?';
  db.query(companyQuery, [company_id], (err, companyResult) => {
    if (err) {
      console.error('Database error (company query):', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (companyResult.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company_name = companyResult[0].company_name;

    if (attachment) {
      // Tentukan nama file yang akan disimpan di Google Cloud Storage
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
        // Setelah upload berhasil, dapatkan URL publik file
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

        // Menyimpan data tiket di database
        const ticketQuery = `
          INSERT INTO tickets (
            ticket_id, 
            product_list, 
            describe_issue, 
            detail_issue, 
            priority, 
            contact, 
            company_id, 
            company_name, 
            attachment, 
            status
          ) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            publicUrl,  // Menyimpan URL publik di database
            status
          ],
          async (err, result) => {
            if (err) {
              console.error('Database error (ticket query):', err);
              return res.status(500).json({ error: 'Database error' });
            }

            // Data tiket untuk email
            const ticketData = {
              ticket_id: ticketId,
              product_list,
              describe_issue,
              detail_issue,
              priority,
              contact,
              company_name,
              status,
              attachment: publicUrl
            };

            // Kirim email ke Admin
            try {
              await sendTicketEmail(ticketData);
              console.log('Email notification sent to admin!');
            } catch (emailError) {
              console.error('Error sending email notification:', emailError);
            }

            res.status(201).json({ message: 'Ticket created successfully', ticketId });
          }
        );
      });

      blobStream.end(attachment.buffer); // Mulai mengupload file
    } else {
      // Jika tidak ada file, lanjutkan ke penyimpanan data tiket tanpa attachment
      const ticketQuery = `
        INSERT INTO tickets (
          ticket_id, 
          product_list, 
          describe_issue, 
          detail_issue, 
          priority, 
          contact, 
          company_id, 
          company_name, 
          attachment, 
          status
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          null, // Tidak ada attachment
          status
        ],
        async (err, result) => {
          if (err) {
            console.error('Database error (ticket query):', err);
            return res.status(500).json({ error: 'Database error' });
          }

          // Data tiket untuk email
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

          // Kirim email ke Admin
          try {
            await sendTicketEmail(ticketData);
            console.log('Email notification sent to admin!');
          } catch (emailError) {
            console.error('Error sending email notification:', emailError);
          }

          res.status(201).json({ message: 'Ticket created successfully', ticketId });
        }
      );
    }
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
  const { company_id, company_name, product_list, describe_issue, detail_issue, priority, contact } = req.body;

  // Validasi input
  if (
    !company_id || 
    !company_name || 
    !product_list || 
    !describe_issue || 
    !detail_issue || 
    !priority || 
    !contact
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Query untuk mengupdate tiket
  const query = `
    UPDATE tickets SET 
      company_id = ?, 
      company_name = ?, 
      product_list = ?, 
      describe_issue = ?, 
      detail_issue = ?, 
      priority = ?, 
      contact = ?
    WHERE ticket_id = ?
  `;

  db.query(query, [
    company_id, 
    company_name, 
    product_list, 
    describe_issue, 
    detail_issue, 
    priority, 
    contact, 
    ticketId
  ], (err, result) => {
    if (err) {
      console.error('Database error (update query):', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(200).json({ message: 'Ticket updated successfully' });
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

router.delete('/:ticket_id', (req, res) => {
  const ticketId = req.params.ticket_id;

  // Debugging log untuk memastikan ID yang diterima
  console.log('Received ticket ID:', ticketId);

    // Setelah komentar dihapus, lanjutkan menghapus tiket
    const deleteTicketQuery = 'DELETE FROM tickets WHERE ticket_id = ?';
    db.query(deleteTicketQuery, [ticketId], (err, ticketResult) => {
      if (err) {
        console.error('Database error (ticket delete):', err.message);
        return res.status(500).json({ error: `Database error while deleting ticket: ${err.message}` });
      }

      if (ticketResult.affectedRows === 0) {
        console.log(`Ticket with ID ${ticketId} not found.`);
        return res.status(404).json({ message: 'Ticket not found' });
      }

      // Tiket berhasil dihapus
      res.status(200).json({ message: 'Ticket and associated comments deleted successfully' });
    });
  });


module.exports = router;
