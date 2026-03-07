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
        // console.warn('[Embeddings] No API key available for embeddings');
        return null;
    }

    try {
        // Groq does not support OpenAI embedding models. 
        // If we are using Groq as the client (via baseURL), this will fail.
        // We should only attempt this if we are actually hitting OpenAI.
        const isGroq = openai.baseURL.includes('groq');
        if (isGroq) {
            return null; // Groq doesn't support embeddings.create for text-embedding-3-small
        }

        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
        });

        return response.data[0].embedding;
    } catch (e: any) {
        console.error('[Embeddings] Failed to generate embedding:', e.message);
        return null;
    }
}
