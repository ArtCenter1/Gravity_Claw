import { NextResponse } from 'next/server';

// Provider configuration (would come from a database in production)
// For now, these would be set via environment variables on the bot side
const providers = [
    {
        id: 'google',
        name: 'Google Gemini',
        models: ['gemini-2.0-flash', 'gemini-2.5-flash-preview-05-20', 'gemini-1.5-pro'],
        description: 'Fast and capable Google models'
    },
    {
        id: 'openai',
        name: 'OpenAI',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
        description: 'OpenAI GPT models'
    },
    {
        id: 'anthropic',
        name: 'Anthropic (Claude)',
        models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
        description: 'Anthropic Claude models'
    },
    {
        id: 'deepseek',
        name: 'DeepSeek',
        models: ['deepseek-chat', 'deepseek-coder'],
        description: 'Open-source DeepSeek models'
    },
    {
        id: 'groq',
        name: 'Groq',
        models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
        description: 'Fast inference via Groq'
    },
    {
        id: 'ollama',
        name: 'Ollama (Local)',
        models: ['llama3', 'mistral', 'codellama'],
        description: 'Local models via Ollama'
    },
];

export async function GET() {
    // In production, this would read from a database
    // For now, return the provider list with available models

    return NextResponse.json({
        providers,
        // Current settings (would come from bot config)
        currentProvider: process.env.LLM_PROVIDER || 'google',
        currentModel: process.env.LLM_MODEL || '',
    });
}
