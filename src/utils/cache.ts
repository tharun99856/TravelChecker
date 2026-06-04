import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

const db = new Database(path.join(dbPath, 'travel.db'));

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS distance_cache (
    id TEXT PRIMARY KEY,
    from_loc TEXT NOT NULL,
    to_loc TEXT NOT NULL,
    distance_km REAL NOT NULL,
    duration_mins REAL NOT NULL,
    source TEXT,
    timestamp INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS fare_cache (
    id TEXT PRIMARY KEY,
    route_id TEXT NOT NULL,
    mode TEXT NOT NULL,
    fare REAL NOT NULL,
    timestamp INTEGER NOT NULL
  );
`);

const distanceColumns = db.prepare('PRAGMA table_info(distance_cache)').all() as Array<{ name: string }>;
if (!distanceColumns.some(column => column.name === 'source')) {
  db.exec('ALTER TABLE distance_cache ADD COLUMN source TEXT');
}

export const cache = {
  getDistance(from: string, to: string) {
    const id = [from.toLowerCase(), to.toLowerCase()].sort().join('-');
    const stmt = db.prepare('SELECT * FROM distance_cache WHERE id = ?');
    const row = stmt.get(id) as any;
    
    // 30 day TTL. Only cache real Google Maps results; fallback estimates must not
    // prevent a later successful Maps lookup.
    if (
      row &&
      row.source === 'google_maps' &&
      (Date.now() - row.timestamp) < 30 * 24 * 60 * 60 * 1000
    ) {
      return {
        distanceKm: row.distance_km,
        durationMins: row.duration_mins
      };
    }
    return null;
  },

  setDistance(from: string, to: string, distanceKm: number, durationMins: number, source = 'google_maps') {
    const id = [from.toLowerCase(), to.toLowerCase()].sort().join('-');
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO distance_cache (id, from_loc, to_loc, distance_km, duration_mins, source, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, from, to, distanceKm, durationMins, source, Date.now());
  }
};
