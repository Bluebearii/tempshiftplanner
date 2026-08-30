const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.static('.'));
app.use(express.json());

// In-memory data store (for production, use a database)
let appData = {
  employees: [],
  schedule: {}
};

// API Routes
app.get('/api/data', (req, res) => {
  res.json(appData);
});

app.post('/api/data', (req, res) => {
  appData = req.body;
  res.json({ success: true });
});

// Serve HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'shift-planner-enhanced.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Shift Planner running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
