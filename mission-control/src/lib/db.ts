import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Connect to the SQLite database - use a reliable absolute path
const DB_PATH = path.join(process.cwd(), '..', '.data', 'gravity_claw.sqlite');

let db: Database.Database;

try {
    // Check if database file exists before connecting
    if (fs.existsSync(DB_PATH)) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        console.log('Successfully connected to database at:', DB_PATH);
    } else {
        console.warn('Database NOT found at:', DB_PATH, '- falling back to in-memory');
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
    type: string;
    category: string;
    created_at: string;
    updated_at: string;
    // URL metadata fields
    metadata_title?: string;
    metadata_thumbnail?: string;
    metadata_channel?: string;
    metadata_video_id?: string;
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

export interface Todo {
    id: string;
    text: string;
    completed: number;
    updated_at: string;
}

export interface HabitLog {
    day_index: number;
    status: string;
    updated_at: string;
}

export interface ProductivityNote {
    id: string;
    content: string;
    updated_at: string;
}

// Queries
export function getMessages(limit: number = 50): MessageLog[] {
    try {
        const stmt = db.prepare('SELECT * FROM message_log ORDER BY timestamp DESC LIMIT ?');
        return stmt.all(limit) as MessageLog[];
    } catch (error) {
        console.error('getMessages error:', error);
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

export function saveFact(id: string, fact: string, type: string = 'note', category: string = 'general', metadata?: { title?: string; thumbnail?: string; channel?: string; videoId?: string }): void {
    try {
        const stmt = db.prepare(`
      INSERT INTO core_facts (id, fact, type, category, metadata_title, metadata_thumbnail, metadata_channel, metadata_video_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET 
        fact = excluded.fact, 
        type = excluded.type, 
        category = excluded.category, 
        metadata_title = COALESCE(excluded.metadata_title, core_facts.metadata_title),
        metadata_thumbnail = COALESCE(excluded.metadata_thumbnail, core_facts.metadata_thumbnail),
        metadata_channel = COALESCE(excluded.metadata_channel, core_facts.metadata_channel),
        metadata_video_id = COALESCE(excluded.metadata_video_id, core_facts.metadata_video_id),
        updated_at = CURRENT_TIMESTAMP
    `);
        stmt.run(id, fact, type, category, metadata?.title || null, metadata?.thumbnail || null, metadata?.channel || null, metadata?.videoId || null);
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

// Productivity Queries
export function getTodos(): Todo[] {
    try {
        return db.prepare('SELECT * FROM todos ORDER BY updated_at DESC').all() as Todo[];
    } catch (error) {
        console.error('getTodos error:', error);
        return [];
    }
}

export function saveTodo(todo: { id: string; text: string; completed: number }): void {
    try {
        db.prepare('INSERT INTO todos (id, text, completed, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET text=excluded.text, completed=excluded.completed, updated_at=CURRENT_TIMESTAMP').run(todo.id, todo.text, todo.completed);
    } catch (error) {
        console.error('Failed to save todo:', error);
    }
}

export function deleteTodo(id: string): void {
    try {
        db.prepare('DELETE FROM todos WHERE id = ?').run(id);
    } catch (error) {
        console.error('Failed to delete todo:', error);
    }
}

export function getHabits(): HabitLog[] {
    try {
        return db.prepare('SELECT * FROM habit_logs').all() as HabitLog[];
    } catch {
        return [];
    }
}

export function saveHabit(day_index: number, status: string): void {
    try {
        db.prepare('INSERT INTO habit_logs (day_index, status, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(day_index) DO UPDATE SET status=excluded.status, updated_at=CURRENT_TIMESTAMP').run(day_index, status);
    } catch (error) {
        console.error('Failed to save habit:', error);
    }
}

export function getProductivityNotes(): ProductivityNote[] {
    try {
        return db.prepare('SELECT * FROM productivity_notes ORDER BY updated_at DESC').all() as ProductivityNote[];
    } catch {
        return [];
    }
}

export function saveProductivityNote(id: string, content: string): void {
    try {
        db.prepare('INSERT INTO productivity_notes (id, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET content=excluded.content, updated_at=CURRENT_TIMESTAMP').run(id, content);
    } catch (error) {
        console.error('Failed to save note:', error);
    }
}

export function deleteProductivityNote(id: string): void {
    try {
        db.prepare('DELETE FROM productivity_notes WHERE id = ?').run(id);
    } catch (error) {
        console.error('Failed to delete productivity note:', error);
    }
}
