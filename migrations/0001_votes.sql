-- One row per blind A/B vote. IPs are never stored, only a salted hash used for rate limiting.
CREATE TABLE IF NOT EXISTS votes (
  id             INTEGER PRIMARY KEY,
  token_id       TEXT    NOT NULL UNIQUE,   -- one vote per issued pair
  prompt_version TEXT    NOT NULL,
  a              TEXT    NOT NULL,          -- run id shown on the left
  b              TEXT    NOT NULL,          -- run id shown on the right
  winner         TEXT    NOT NULL CHECK (winner IN ('a', 'b', 'tie')),
  coat           TEXT,
  seed           INTEGER,
  ip_hash        TEXT    NOT NULL,
  created_at     INTEGER NOT NULL           -- ms since epoch
);
CREATE INDEX IF NOT EXISTS votes_version ON votes (prompt_version, id);
CREATE INDEX IF NOT EXISTS votes_ip_time ON votes (ip_hash, created_at);
