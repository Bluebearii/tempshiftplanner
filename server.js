const express = require('express');
const path = require('path');
const app = express();

app.use(express.static('.'));
app.use(express.json({ limit: '10mb' }));

// JSONBin Configuration - loaded from environment variables
const JSONBIN_MASTER_KEY = process.env.JSONBIN_MASTER_KEY;
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

// In-memory cache
let appData = { employees: [], schedule: {} };
let lastFetch = 0;
const CACHE_TIME = 5000; // 5 seconds

// Load from JSONBin
async function loadFromJSONBin() {
  if (!JSONBIN_MASTER_KEY || !JSONBIN_BIN_ID) {
    console.warn('JSONBin credentials not set - using in-memory only');
    return;
  }
  
  try {
    const res = await fetch(`${JSONBIN_URL}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
    });
    if (res.ok) {
      const data = await res.json();
      appData = data.record || { employees: [], schedule: {} };
      lastFetch = Date.now();
      console.log('Loaded data from JSONBin');
    } else {
      console.error('JSONBin load failed:', res.status);
    }
  } catch (err) {
    console.error('JSONBin load error:', err.message);
  }
}

// Save to JSONBin
async function saveToJSONBin() {
  if (!JSONBIN_MASTER_KEY || !JSONBIN_BIN_ID) return;
  
  try {
    const res = await fetch(JSONBIN_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_MASTER_KEY
      },
      body: JSON.stringify(appData)
    });
    if (res.ok) {
      console.log('Saved to JSONBin');
    } else {
      console.error('JSONBin save failed:', res.status);
    }
  } catch (err) {
    console.error('JSONBin save error:', err.message);
  }
}

// Load on startup
loadFromJSONBin();

// API Routes
app.get('/api/data', async (req, res) => {
  // Refresh from JSONBin if cache is stale
  if (Date.now() - lastFetch > CACHE_TIME) {
    await loadFromJSONBin();
  }
  res.json(appData);
});

app.post('/api/data', async (req, res) => {
  appData = req.body;
  await saveToJSONBin();
  res.json({ success: true, timestamp: Date.now() });
});

// Serve HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'shift-planner-enhanced.html'));
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Shift Planner running on port ${PORT}`);
  console.log(`JSONBin configured: ${!!JSONBIN_MASTER_KEY && !!JSONBIN_BIN_ID}`);
});
