const nodemailer = require('nodemailer');
const db = require('../db');

// Transporter untuk mengirim email
const transporter = nodemailer.createTransport({
  service: 'gmail', // Anda juga bisa gunakan SMTP server lain
  auth: {
    user: 'support@dev.magnaglobal.id', // Ganti dengan email Anda
    pass: 'qqfejvxousooompa'  // Ganti dengan password atau App Password
  }
});

const sendTicketEmail = async (ticketData, id_user) => {
  const { ticket_id, product_list, describe_issue, detail_issue, priority, contact, company_name, status } = ticketData;

  // Query untuk mendapatkan email pengguna berdasarkan id_user
  const emailQuery = 'SELECT email FROM users WHERE id_user = ?';
  db.query(emailQuery, [id_user], async (err, result) => {
    if (err) {
      console.error('Error fetching user email:', err);
      return;
    }

    if (result.length === 0) {
      console.error('User not found for id_user:', id_user);
      return;
    }

    const userEmail = result[0].email;

    const mailOptions = {
      from: 'support@dev.magnaglobal.id', // Email pengirim
      to: userEmail, // Email penerima berdasarkan id_user
      subject: `New Support Ticket Created: ${ticket_id}`,
      html: `
        <h2>New Support Ticket</h2>
        <p><strong>Ticket ID:</strong> ${ticket_id}</p>
        <p><strong>Company Name:</strong> ${company_name}</p>
        <p><strong>Product List:</strong> ${product_list}</p>
        <p><strong>Describe Issue:</strong> ${describe_issue}</p>
        <p><strong>Detail Issue:</strong> ${detail_issue}</p>
        <p><strong>Priority:</strong> ${priority}</p>
        <p><strong>Contact:</strong> ${contact}</p>
        <p><strong>Status:</strong> ${status}</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully to:', userEmail);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  });
};

module.exports = { sendTicketEmail };