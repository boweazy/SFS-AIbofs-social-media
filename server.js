const express = require('express');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://formspree.io"]
    }
  }
}));

// Middleware
app.use(express.static('static'));
app.use(express.static('assets'));
app.use(express.json());

// API endpoints for existing Social AI functionality
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'SmartFlow SocialScale' });
});

// Serve the enhanced PWA (preserving existing features)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

// New SocialScale pages
app.get('/book', (req, res) => {
  res.sendFile(path.join(__dirname, 'book.html'));
});

app.get('/shop', (req, res) => {
  res.sendFile(path.join(__dirname, 'shop.html'));
});

app.get('/bots', (req, res) => {
  res.sendFile(path.join(__dirname, 'bots.html'));
});

// Flask routes (for booking/admin system)
app.get('/flask', (req, res) => {
  res.redirect('/flask/');
});

app.get('/flask/', (req, res) => {
  res.send(`
    <h1>SmartFlow Flask Admin</h1>
    <p>The Flask booking/admin system is available separately.</p>
    <a href="/">Back to Social AI</a>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SmartFlow SocialScale server running on port ${PORT}`);
  console.log(`📱 Social AI PWA: http://localhost:${PORT}/`);
  console.log(`📅 Booking: http://localhost:${PORT}/book`);
  console.log(`🛒 Shop: http://localhost:${PORT}/shop`);
  console.log(`🤖 Bots: http://localhost:${PORT}/bots`);
});