let io;
const http = require("http");
const { Server } = require("socket.io");
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = 6001;

/**
 * IMPORTANT:
 * Bind to 0.0.0.0 so browser + IPv4/IPv6 both work
 */
app.use(cors({ origin: "*" }));
app.use(express.json());

const LOG_FILE = path.join(__dirname, 'app-logs.jsonl');

// --- Terminal Colors ---
const COLORS = {
  reset: "\x1b[0m",
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  debug: "\x1b[90m",
  success: "\x1b[32m"
};

app.post('/log', async (req, res) => {
  const log = {
    ...req.body,
    receivedAt: new Date().toISOString(),
  };

  try {
    await pool.query(
  `INSERT INTO logs 
   (app_name, service, environment, level, message, timestamp, received_at, url, metadata)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
  [
    log.appName || "unknown",
    log.service || "unknown",
    log.environment || "dev",
    log.level || "info",
    log.message || "",
    log.timestamp ? new Date(log.timestamp) : new Date(),
    new Date(log.receivedAt || new Date()),
    log.url || null,
    JSON.stringify(log.metadata || {})
  ]
);

    printToTerminal(log);

// 🔥 ADD THIS LINE
io.emit("new_log", log);

res.status(200).json({ status: "ok" });

  } catch (err) {
  console.error("❌ FULL DB ERROR:", err);
  res.status(500).json({ 
    error: "Failed to store log",
    details: err.message 
  });
}
});
function printToTerminal(entry) {
  const level = (entry.level || 'INFO').toUpperCase();
  const message = entry.message || '';
  const time = new Date().toLocaleTimeString();

  let color = COLORS.info;
  if (level.includes('ERROR')) color = COLORS.error;
  else if (level.includes('WARN')) color = COLORS.warn;

  console.log(
    `${COLORS.debug}[${time}]${COLORS.reset} ${color}[${level}]${COLORS.reset} ${message}`
  );

  if (entry.url) {
    console.log(`${COLORS.debug}   ↳ URL: ${entry.url}${COLORS.reset}`);
  }
}

app.get("/stats", async (req, res) => {
  try {
    const totalLogs = await pool.query("SELECT COUNT(*) FROM logs");

    const errors = await pool.query(
      "SELECT COUNT(*) FROM logs WHERE level = 'error'"
    );

    const warns = await pool.query(
      "SELECT COUNT(*) FROM logs WHERE level = 'warn'"
    );

    const services = await pool.query(
      "SELECT COUNT(DISTINCT service) FROM logs"
    );

    res.json({
      totalLogs: parseInt(totalLogs.rows[0].count),
      errorCount: parseInt(errors.rows[0].count),
      warnCount: parseInt(warns.rows[0].count),
      uniqueServices: parseInt(services.rows[0].count),
      errorRate:
  totalLogs.rows[0].count > 0
    ? ((errors.rows[0].count / totalLogs.rows[0].count) * 100).toFixed(2)
    : "0"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "stats failed" });
  }
});

app.get("/metrics", (req, res) => {
  res.json({
    cpu: Math.floor(Math.random() * 100),
    memory: Math.floor(Math.random() * 100),
    requests: Math.floor(Math.random() * 1000),
  });
});

//full text search using gin indexing
// Optimized full-text search using GIN indexing
app.get('/search/gin', async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q) {
    return res.json({
      time_ms: 0,
      rows: [],
      totalPages: 0,
      totalRows: 0
    });
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  const start = Date.now();

  try {
    const result = await pool.query(
      `
      SELECT *, 
      ts_rank(
        to_tsvector('english', message), 
        plainto_tsquery('english', $1)
      ) AS rank
      FROM logs
      WHERE to_tsvector('english', message) @@ plainto_tsquery('english', $1)
      ORDER BY rank DESC
      LIMIT $2 OFFSET $3
      `,
      [q, limitNum, offset]
    );

    const rows = result.rows;

    res.json({
      time_ms: Date.now() - start,
      rows: rows,
      totalRows: rows.length,
      totalPages: Math.ceil(rows.length / limitNum),
      currentPage: pageNum
    });

  } catch (err) {
    console.error("❌ GIN search failed:", err.message);
    res.status(500).json({ error: "GIN search failed" });
  }
});

//normal search to compare time
app.get('/search/normal', async (req, res) => {
  const { q } = req.query;
  const start = Date.now();

  try {
    const result = await pool.query(
      `SELECT * FROM logs 
       WHERE message ILIKE $1 
       ORDER BY received_at DESC `,
      [`%${q}%`]
    );

    const timeTaken = Date.now() - start;

    res.json({
      time_ms: timeTaken,
      rows: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Normal search failed" });
  }
});

// NEW: Endpoint to fetch dynamic options for the dropdowns
app.get('/logs/filter-options', async (req, res) => {
   try {
    const apps = await pool.query("SELECT DISTINCT app_name FROM logs");
    const services = await pool.query("SELECT DISTINCT service FROM logs");
    const levels = await pool.query("SELECT DISTINCT level FROM logs");

    res.json({
      apps: apps.rows.map(r => r.app_name),
      services: services.rows.map(r => r.service),
      levels: levels.rows.map(r => r.level),
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch filters" });
  }
});

// NEW: Endpoint to fetch logs based on selected dropdown filters
app.get('/logs/filter', async (req, res) => {
  const { app_name, level, service } = req.query;
  
  let query = `SELECT * FROM logs WHERE 1=1`;
  const params = [];
  let paramIdx = 1;

  if (app_name) {
    query += ` AND app_name = $${paramIdx++}`;
    params.push(app_name);
  }
  if (level) {
    query += ` AND level ILIKE $${paramIdx++}`;
    params.push(level);
  }
  if (service) {
    query += ` AND service = $${paramIdx++}`;
    params.push(service);
  }

  query += ` ORDER BY received_at DESC LIMIT 100`;

  try {
    const result = await pool.query(query, params);
    res.json({
  rows: result.rows,
  totalPages: 1
});
  } catch (err) {
    console.error("❌ DB Error filtering logs:", err.message);
    res.status(500).json({ error: "Failed to filter logs" });
  }
});

app.get("/logs/search", async (req, res) => {
  try {
    const { q, level, service } = req.query;

    let query = "SELECT * FROM logs WHERE 1=1";
    const values = [];

    if (q) {
      values.push(`%${q}%`);
      query += ` AND message ILIKE $${values.length}`;
    }

    if (level) {
      values.push(level);
      query += ` AND level ILIKE $${values.length}`;
    }

    if (service) {
      values.push(service);
      query += ` AND service = $${values.length}`;
    }

    query += " ORDER BY received_at DESC LIMIT 100";

    const result = await pool.query(query, values);
    res.json({
  rows: result.rows,
  totalPages: 1
});

  } catch (err) {
    console.error("❌ Search failed:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

app.get('/logs', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT * FROM logs 
       ORDER BY received_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      logs: result.rows,
      totalLogs: result.rows.length
    });

  } catch (err) {
    console.error("❌ Fetch logs failed:", err.message);

    res.json({
      logs: [],
      totalLogs: 0
    });
  }
});

// --- EXPORT ENDPOINT ---
app.get('/logs/export', async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const result = await pool.query('SELECT * FROM logs ORDER BY received_at DESC LIMIT 5000');
    const logs = result.rows;

    if (format === 'csv') {
      if (logs.length === 0) return res.send("");
      const header = Object.keys(logs[0]).join(',');
      const rows = logs.map(log => 
        Object.values(log).map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')
      );
      res.header('Content-Type', 'text/csv');
      res.attachment('logs.csv');
      return res.send([header, ...rows].join('\n'));
    } else {
      res.header('Content-Type', 'application/json');
      res.attachment('logs.json');
      return res.send(JSON.stringify(logs, null, 2));
    }
  } catch (err) {
    console.error("❌ Export failed:", err.message);
    res.status(500).json({ error: "Export failed" });
  }
});

const server = http.createServer(app);

io = new Server(server, {
  cors: {
    origin: "*",
  },
}
);

io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

const startServer = () => {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

// wait 5 sec for postgres
setTimeout(startServer, 5000);