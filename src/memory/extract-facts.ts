import { db } from '../db/sqlite.js';
import { saveFact } from './core.js';
import { getLLMProvider } from '../llm/factory.js';
import { LLMMessage } from '../llm/types.js';

const EXTRACTION_THRESHOLD = 15; // Run extraction every 15 messages

export async function extractFactsInBackground(): Promise<void> {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM message_log');
    const row = stmt.get() as { count: number };

    // We only want to trigger this extraction periodically based on volume
    if (row.count % EXTRACTION_THRESHOLD !== 0) {
        return;
    }

    console.log('[Memory] Background fact extraction triggered.');

    // Get the most recent chunk of conversation
    const toExtractStmt = db.prepare('SELECT * FROM message_log ORDER BY id DESC LIMIT ?');
    const recentMessages = toExtractStmt.all(EXTRACTION_THRESHOLD) as { id: number, role: string, content: string }[];
    const transcript = recentMessages.reverse().map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n');

    const prompt = `
You are a background data archivist analyzing a conversation between a User and an AI Assistant.
Your job is to identify and extract NEW, evergreen core facts about the USER from this recent chunk of conversation.
Examples of core facts: User's name, where they live, a project they are working on, their pets, their preferences.
Do not extract fleeting thoughts.

Recent conversation log:
"""
${transcript}
"""

If you find a new fact worth saving, output it in EXACTLY this JSON format on a single line, and NOTHING else:
{"id": "fact_identifier_snake_case", "fact": "The actual fact written in third person."}
If there are multiple facts, output multiple JSON objects on separate lines.
If there are no facts worth saving, output "NO_FACTS".
    `.trim();

    try {
        // Use unified LLM provider
        const provider = getLLMProvider();
        const messages: LLMMessage[] = [{ role: 'user', content: prompt }];
        const result = await provider.processMessage(messages);

        if (result.content.includes("NO_FACTS") || result.content.trim() === "") {
            return;
        }

        // Try to parse lines as JSON facts
        const lines = result.content.split('\n');
        for (const line of lines) {
            try {
                const parsed = JSON.parse(line.trim());
                if (parsed.id && parsed.fact) {
                    saveFact(parsed.id, parsed.fact);
                    console.log(`[Memory] Background extraction saved fact: ${parsed.id}`);
                }
            } catch (jsonError) {
                // Ignore parsing errors for lines that aren't valid JSON
            }
        }
    } catch (e) {
        console.error('[Memory] Background fact extraction failed:', e);
    }
}
