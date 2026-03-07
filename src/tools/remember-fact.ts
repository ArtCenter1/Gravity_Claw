import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { saveFact } from '../memory/core.js';

// Gemini Format
export const rememberFactGeminiDef: FunctionDeclaration = {
    name: 'remember_fact',
    description: 'Saves a core evergreen fact about the user to long-term memory. Use this to remember important preferences, names, or details that should persist across all future conversations. The fact should be concise and written in the third person.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            id: {
                type: SchemaType.STRING,
                description: 'A unique, descriptive snake_case identifier for this fact (e.g., "user_name", "preferred_language", "pet_dog_name").',
            },
            fact: {
                type: SchemaType.STRING,
                description: 'The actual fact to remember.',
            },
        },
        required: ['id', 'fact'],
    },
};

// OpenAI Format
export const rememberFactOpenAIDef = {
    type: 'function' as const,
    function: {
        name: 'remember_fact',
        description: 'Saves a core evergreen fact about the user to long-term memory. Use this to remember important preferences, names, or details that should persist across all future conversations. The fact should be concise and written in the third person.',
        parameters: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'A unique, descriptive snake_case identifier for this fact (e.g., "user_name", "preferred_language", "pet_dog_name").',
                },
                fact: {
                    type: 'string',
                    description: 'The actual fact to remember.',
                },
            },
            required: ['id', 'fact'],
        },
    },
};

export function rememberFact(args: string | Record<string, any>): string {
    try {
        const parsed = typeof args === 'string' ? JSON.parse(args) : args;
        const { id, fact } = parsed;

        if (!id || !fact) {
            throw new Error('Missing required arguments: id or fact');
        }

        saveFact(id, fact);
        return `Successfully saved fact '${id}'.`;
    } catch (error: any) {
        return `Error saving fact: ${error.message}`;
    }
}
