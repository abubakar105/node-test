require('dotenv').config()
const express = require('express')
const app = express()
const Router = require('./Routes/Router')
const cors = require('cors')
const connectDB = require('./DataBase/DB');
const path = require('path');

const _dirname = path.resolve();
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// CORS configuration for production

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions))

// Ensure database connection before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.use('/', Router);
app.use(express.static(path.join(_dirname, 'client/dist')));
app.get('*', (req,res) => {
  res.sendFile(path.resolve(_dirname, 'client', 'dist', 'index.html'));
})
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
const port = 8000
app.listen(port, ()=>{
  console.log('app is running')
})

module.exports = app;

