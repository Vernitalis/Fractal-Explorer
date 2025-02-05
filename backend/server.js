require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/db');
const { createProxyMiddleware } = require('http-proxy-middleware');

const authRoutes = require('./routes/authRoutes');
const fractalRoutes = require('./routes/fractalRoutes');
const PORT = process.env.PORT || 5000;

const app = express();
connectDB();

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/fractals', fractalRoutes);

const apiUrl = process.env.API_URL || `http://localhost:${PORT}`;
app.use('/api', createProxyMiddleware({
  target: apiUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', 
  },
}));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
