const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

 
const PORT = process.env.PORT || 8000;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Product and Order API',
      version: '1.0.0',
      description: 'API documentation for Products and Orders management',
    },
    servers: [
    {
      url: `http://localhost:${PORT}`,
      description: 'Development server',
    }
    ],
  },
  apis: ['./src/routes/*.js'], 
};

const specs = swaggerJsdoc(options);
module.exports = specs; 