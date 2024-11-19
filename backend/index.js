const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

// Import routes
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const ticketRoutes = require('./routes/tickets');
const serviceRoutes = require('./routes/services');

// Koneksi database
const db = require('./db'); // Koneksi database

// Buat instance express
const app = express();

// Konfigurasi CORS
app.use(cors({
  origin: '*', // Ubah jika ingin membatasi domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware parsing body
app.use(express.json());

// Konfigurasi Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express API',
      version: '1.0.0',
      description: 'API documentation for the backend application',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Development server' }],
  },
  apis: ['./routes/*.js'], // Sesuaikan dengan lokasi file route Anda
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Gunakan modul routes
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/services', serviceRoutes);

// Middleware penanganan error
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Tes koneksi database
db.getConnection((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1); // Keluar dari aplikasi jika koneksi gagal
  } else {
    console.log('Database connected successfully');
  }
});

// Jalankan server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
