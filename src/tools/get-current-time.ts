import { FunctionDeclaration } from '@google/generative-ai';

// Gemini Format
export const getCurrentTimeGeminiDef: FunctionDeclaration = {
    name: 'get_current_time',
    description: 'Gets the current exact time locally.',
};

// OpenAI / OpenRouter Format
export const getCurrentTimeOpenAIDef = {
    type: 'function' as const,
    function: {
        name: 'get_current_time',
        description: 'Gets the current exact time locally.',
        parameters: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
};

export function getCurrentTime(): string {
    return new Date().toISOString();
}
