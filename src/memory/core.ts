import { db } from '../db/sqlite.js';

export interface CoreFact {
    id: string;
    fact: string;
    created_at: string;
    updated_at: string;
}

export function getAllFacts(): CoreFact[] {
    const stmt = db.prepare('SELECT * FROM core_facts ORDER BY updated_at DESC');
    return stmt.all() as CoreFact[];
}

export function saveFact(id: string, fact: string): void {
    const stmt = db.prepare(`
        INSERT INTO core_facts (id, fact, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET fact = excluded.fact, updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(id, fact);
}

export function deleteFact(id: string): void {
    const stmt = db.prepare('DELETE FROM core_facts WHERE id = ?');
    stmt.run(id);
}

// Formats facts into a single string for the system prompt
export function getFormattedFacts(): string {
    const facts = getAllFacts();
    if (facts.length === 0) return '';
    return '\n\nUser Core Facts:\n' + facts.map(f => `- [${f.id}] ${f.fact}`).join('\n');
}
