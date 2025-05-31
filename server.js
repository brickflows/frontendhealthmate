const express = require('express');
const path = require('path');

// Try to require cors, fallback if not available
let cors;
try {
  cors = require('cors');
} catch (e) {
  console.log('CORS not available, using manual headers');
  cors = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  };
}

const app = express();

// Middleware
app.use(cors);
app.use(express.json());

// Serve static files from current directory (serverless function context)
app.use(express.static(__dirname));

// Add logging for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// API Routes (basic test route)
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'HealthMate AI API is working!',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'HealthMate AI Frontend'
  });
});

// Serve main pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/chat.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'chat.html'));
});

app.get('/symptoms.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'symptoms.html'));
});

app.get('/tips.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'tips.html'));
});

app.get('/awareness.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'awareness.html'));
});

app.get('/quiz.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'quiz.html'));
});

app.get('/history.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'history.html'));
});

// Handle 404 - redirect to home
app.get('*', (req, res) => {
  // Check if it's a file request (has extension)
  if (path.extname(req.path)) {
    res.status(404).send('File not found');
  } else {
    // Redirect routes without extensions to home
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Export for Vercel
module.exports = app;

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ HealthMate AI Frontend running on port ${PORT}`);
    console.log(`🌐 Access at: http://localhost:${PORT}`);
  });
}
