import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, 'nehairo.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT,
      canUpload BOOLEAN DEFAULT 1,
      canDelete BOOLEAN DEFAULT 1,
      canDownload BOOLEAN DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Activity audit logs
  db.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      action TEXT,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // AI chat / action history
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_history (
      id TEXT PRIMARY KEY,
      role TEXT,
      content TEXT,
      model TEXT,
      metadata TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bookmarked and pinned files
  db.run(`
    CREATE TABLE IF NOT EXISTS pinned_files (
      id TEXT PRIMARY KEY,
      path TEXT UNIQUE,
      name TEXT,
      category TEXT,
      tags TEXT,
      addedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default admin if missing
  db.get("SELECT * FROM users WHERE username = 'admin'", async (err, row) => {
    if (!row) {
      const hash = await bcrypt.hash('admin123', 10);
      db.run(
        "INSERT INTO users (id, username, password, role, canUpload, canDelete, canDownload) VALUES (?, ?, ?, ?, 1, 1, 1)",
        [uuidv4(), 'admin', hash, 'admin']
      );
      console.log('⚡ [NEhAIro.FS] Default Operator Account Initialized: admin / admin123');
    }
  });
});

export default db;
