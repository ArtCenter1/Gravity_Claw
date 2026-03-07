import OpenAI from 'openai';
import { config } from '../config.js';

let openai: OpenAI | null = null;

// Use OpenAI API key for embeddings (or fallback to OpenRouter)
if (config.openaiApiKey) {
    openai = new OpenAI({
        apiKey: config.openaiApiKey,
    });
} else if (config.groqApiKey) {
    // Groq also supports embeddings via OpenAI compatibility
    openai = new OpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: config.groqApiKey,
    });
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
    if (!openai) {
        console.warn('[Embeddings] No API key available for embeddings');
        return null;
    }

    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
        });

        return response.data[0].embedding;
    } catch (e) {
        console.error('[Embeddings] Failed to generate embedding:', e);
        return null;
    }
}
