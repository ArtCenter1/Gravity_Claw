import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Connect to the SQLite database - use absolute path
const DB_PATH = path.resolve('d:', 'My_Projects', 'Gravity_Claw', '.data', 'gravity_claw.sqlite');

let db: Database.Database;

try {
    // Check if database file exists before connecting
    if (fs.existsSync(DB_PATH)) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
    } else {
        console.log('Database not found at:', DB_PATH);
        db = new Database(':memory:');
    }
} catch (error) {
    console.error('Failed to connect to SQLite database:', error);
    db = new Database(':memory:');
}

export { db };

// Types
export interface MessageLog {
    id: number;
    role: string;
    content: string;
    timestamp: string;
}

export interface CoreFact {
    id: string;
    fact: string;
    created_at: string;
    updated_at: string;
}

export interface Setting {
    key: string;
    value: string;
    updated_at: string;
}

export interface RollingSummary {
    id: number;
    summary: string;
    last_message_id: number;
    updated_at: string;
}

// Queries
export function getMessages(limit: number = 50): MessageLog[] {
    try {
        const stmt = db.prepare('SELECT * FROM message_log ORDER BY timestamp DESC LIMIT ?');
        return stmt.all(limit) as MessageLog[];
    } catch {
        return [];
    }
}

export function getMessageCount(): number {
    try {
        const stmt = db.prepare('SELECT COUNT(*) as count FROM message_log');
        const result = stmt.get() as { count: number };
        return result.count;
    } catch {
        return 0;
    }
}

export function getTodayMessageCount(): number {
    try {
        const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM message_log 
      WHERE date(timestamp) = date('now')
    `);
        const result = stmt.get() as { count: number };
        return result.count;
    } catch {
        return 0;
    }
}

export function getAllFacts(): CoreFact[] {
    try {
        const stmt = db.prepare('SELECT * FROM core_facts ORDER BY updated_at DESC');
        return stmt.all() as CoreFact[];
    } catch {
        return [];
    }
}

export function getFactCount(): number {
    try {
        const stmt = db.prepare('SELECT COUNT(*) as count FROM core_facts');
        const result = stmt.get() as { count: number };
        return result.count;
    } catch {
        return 0;
    }
}

export function saveFact(id: string, fact: string): void {
    try {
        const stmt = db.prepare(`
      INSERT INTO core_facts (id, fact, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET fact = excluded.fact, updated_at = CURRENT_TIMESTAMP
    `);
        stmt.run(id, fact);
    } catch (error) {
        console.error('Failed to save fact:', error);
    }
}

export function deleteFact(id: string): void {
    try {
        const stmt = db.prepare('DELETE FROM core_facts WHERE id = ?');
        stmt.run(id);
    } catch (error) {
        console.error('Failed to delete fact:', error);
    }
}

export function getSettings(): Setting[] {
    try {
        const stmt = db.prepare('SELECT * FROM settings');
        return stmt.all() as Setting[];
    } catch {
        return [];
    }
}

export function getSetting(key: string): string | null {
    try {
        const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
        const result = stmt.get(key) as { value: string } | undefined;
        return result?.value ?? null;
    } catch {
        return null;
    }
}

export function setSetting(key: string, value: string): void {
    try {
        const stmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);
        stmt.run(key, value);
    } catch (error) {
        console.error('Failed to save setting:', error);
    }
}

export function getRollingSummary(): RollingSummary | null {
    try {
        const stmt = db.prepare('SELECT * FROM rolling_summary WHERE id = 1');
        return stmt.get() as RollingSummary | null;
    } catch {
        return null;
    }
}
