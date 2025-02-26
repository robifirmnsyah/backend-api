const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerDocument = require('./swager.json'); // Path ke file JSON OpenAPI Anda

// Import routes
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const ticketRoutes = require('./routes/tickets');
const serviceRoutes = require('./routes/services');
const projectRoutes = require('./routes/projects'); // Tambahkan ini
const groupRoutes = require('./routes/groups'); // Tambahkan ini

// Koneksi database
const db = require('./db'); // Koneksi database

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Express API', version: '1.0.0' },
    servers: [{ url: 'http://localhost:8000' }],
  },
  apis: ['./routes/*.js'],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Gunakan modul routes
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/projects', projectRoutes); // Tambahkan ini
app.use('/api/groups', groupRoutes); // Tambahkan ini

app.listen(8000, () => console.log('Server running on http://localhost:8000'));