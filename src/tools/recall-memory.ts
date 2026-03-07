import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { searchSemanticMemory } from '../memory/semantic.js';
import { generateEmbedding } from '../memory/embeddings.js';

// Gemini Format
export const recallMemoryGeminiDef: FunctionDeclaration = {
    name: 'recall_memory',
    description: 'Searches the long-term semantic memory for relevant past conversations based on a search query. Use this when the user refers to past events outside of the immediate context window.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            query: {
                type: SchemaType.STRING,
                description: 'The search query to find in past conversations.',
            },
        },
        required: ['query'],
    },
};

// OpenAI Format
export const recallMemoryOpenAIDef = {
    type: 'function' as const,
    function: {
        name: 'recall_memory',
        description: 'Searches the long-term semantic memory for relevant past conversations based on a search query. Use this when the user refers to past events outside of the immediate context window.',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'The search query to find in past conversations.',
                },
            },
            required: ['query'],
        },
    },
};

export async function recallMemory(args: string | Record<string, any>): Promise<string> {
    try {
        const parsed = typeof args === 'string' ? JSON.parse(args) : args;
        const { query } = parsed;

        if (!query) {
            throw new Error('Missing required argument: query');
        }

        const embedding = await generateEmbedding(query);
        if (!embedding) {
            return "Error: Could not generate embedding for query to search memory.";
        }

        const results = await searchSemanticMemory(embedding, 5);

        if (results.length === 0) {
            return `No relevant past conversations found for query: "${query}"`;
        }

        const formattedResults = results.map(r => `[${r.role.toUpperCase()}]: ${r.content}`).join('\n');
        return `Found the following relevant past conversation snippets:\n${formattedResults}`;
    } catch (error: any) {
        return `Error searching memory: ${error.message}`;
    }
}
