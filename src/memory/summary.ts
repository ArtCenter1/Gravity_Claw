import { db } from '../db/sqlite.js';
import { getRecentMessages, getRollingSummary, updateRollingSummary } from './buffer.js';
import { getLLMProvider } from '../llm/factory.js';
import { LLMMessage } from '../llm/types.js';

const COMPACTION_THRESHOLD = 25; // Trigger when we hit 25 messages
const MESSAGES_TO_KEEP = 10;     // Leave the most recent 10 messages untouched

export async function checkAndCompactBuffer(): Promise<void> {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM message_log');
    const row = stmt.get() as { count: number };

    if (row.count <= COMPACTION_THRESHOLD) {
        return; // No compaction needed
    }

    console.log(`[Memory] Compaction triggered. Messages: ${row.count}`);

    // Fetch oldest messages that need to be summarized (all except the most recent MESSAGES_TO_KEEP)
    const toSummarizeStmt = db.prepare('SELECT * FROM message_log ORDER BY id ASC LIMIT ?');
    const limit = row.count - MESSAGES_TO_KEEP;
    const oldMessages = toSummarizeStmt.all(limit) as { id: number, role: string, content: string }[];

    if (oldMessages.length === 0) return;

    const highestIdToSummarize = oldMessages[oldMessages.length - 1].id;
    const currentSummary = getRollingSummary() || "";

    const transcript = oldMessages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n');

    const prompt = `
You are an AI memory archivist compiling a rolling summary of a conversation.
Current Summary of older context:
"""
${currentSummary}
"""

New messages to append to the summary:
"""
${transcript}
"""

Task: Write a concise, comprehensive continuation of the summary covering the events of the conversation. Do not drop important facts. Write in third person. Max 3 paragraphs.
    `.trim();

    try {
        // Use unified LLM provider
        const provider = getLLMProvider();
        const messages: LLMMessage[] = [{ role: 'user', content: prompt }];
        const result = await provider.processMessage(messages);
        const newSummary = result.content;

        // Update DB
        updateRollingSummary(newSummary, highestIdToSummarize);

        // Delete the summarized messages
        const deleteStmt = db.prepare('DELETE FROM message_log WHERE id <= ?');
        deleteStmt.run(highestIdToSummarize);

        console.log(`[Memory] Compaction complete. Deleted ${limit} old messages.`);
    } catch (e) {
        console.error('[Memory] Failed to generate rolling summary', e);
    }
}
