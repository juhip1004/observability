CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  app_name TEXT,
  service TEXT,
  environment TEXT,
  level TEXT,
  message TEXT,
  timestamp TIMESTAMP,
  received_at TIMESTAMP,
  url TEXT,
  metadata JSONB
);