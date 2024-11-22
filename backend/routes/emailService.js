const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Anda juga bisa gunakan SMTP server lain
  auth: {
    user: 'support@dev.magnaglobal.id', // Ganti dengan email Anda
    pass: 'qqfejvxousooompa'  // Ganti dengan password atau App Password
  }
});

const sendTicketEmail = async (ticketData) => {
  const { ticket_id, product_list, describe_issue, detail_issue, priority, contact, company_name, status } = ticketData;

  const mailOptions = {
    from: 'your_email@gmail.com', // Email pengirim
    to: 'robi.firmansyah@magnaglobal.id', // Email penerima (Admin)
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
    console.log('Email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendTicketEmail };
