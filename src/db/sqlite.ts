import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), '.data');
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = new Database(path.join(DB_DIR, 'gravity_claw.sqlite'));

// DB Initialization
db.exec(`
    CREATE TABLE IF NOT EXISTS core_facts (
        id TEXT PRIMARY KEY,
        fact TEXT NOT NULL,
        type TEXT DEFAULT 'note',
        category TEXT DEFAULT 'general',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS message_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rolling_summary (
        id INTEGER PRIMARY KEY CHECK (id = 1), -- Single row table
        summary TEXT NOT NULL,
        last_message_id INTEGER NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
        day_index INTEGER PRIMARY KEY,
        status TEXT NOT NULL, -- JSON array of booleans
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS productivity_notes (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// Migration: Add columns if they don't exist
try { db.exec("ALTER TABLE core_facts ADD COLUMN type TEXT DEFAULT 'note'"); } catch (e) { }
try { db.exec("ALTER TABLE core_facts ADD COLUMN category TEXT DEFAULT 'general'"); } catch (e) { }
