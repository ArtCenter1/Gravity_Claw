import { db } from '../db/sqlite.js';

export interface MessageLog {
    id: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
}

export function addMessage(role: string, content: string): void {
    const stmt = db.prepare('INSERT INTO message_log (role, content) VALUES (?, ?)');
    stmt.run(role, content);
}

export function getRecentMessages(limit: number = 20): MessageLog[] {
    const stmt = db.prepare('SELECT * FROM message_log ORDER BY id DESC LIMIT ?');
    const rows = stmt.all(limit) as MessageLog[];
    // Reverse so chronological
    return rows.reverse();
}

export function getRollingSummary(): string | null {
    const stmt = db.prepare('SELECT summary FROM rolling_summary WHERE id = 1');
    const row = stmt.get() as { summary: string } | undefined;
    return row ? row.summary : null;
}

export function updateRollingSummary(summary: string, lastMessageId: number): void {
    const stmt = db.prepare(`
        INSERT INTO rolling_summary (id, summary, last_message_id, updated_at)
        VALUES (1, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET summary = excluded.summary, last_message_id = excluded.last_message_id, updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(summary, lastMessageId);
}
