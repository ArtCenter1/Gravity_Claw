import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Helper to get environment variables from root .env if not in process.env
function getEnvVar(key: string): string | undefined {
    if (process.env[key]) return process.env[key];
    
    try {
        const rootEnvPath = path.join(process.cwd(), '..', '.env');
        if (fs.existsSync(rootEnvPath)) {
            const envConfig = dotenv.parse(fs.readFileSync(rootEnvPath));
            return envConfig[key];
        }
    } catch (err) {
        console.error('Error reading root .env:', err);
    }
    return undefined;
}

export async function GET() {
    try {
        const connections = [
            {
                id: 'telegram',
                name: 'Telegram',
                description: 'Primary communication channel',
                status: getEnvVar('TELEGRAM_BOT_TOKEN') ? 'active' : 'inactive'
            },
            {
                id: 'supabase',
                name: 'Supabase',
                description: 'Semantic memory & real-time data',
                status: getEnvVar('SUPABASE_URL') ? 'active' : 'inactive'
            },
            {
                id: 'gemini',
                name: 'Google Gemini',
                description: 'LLM provider for AI responses',
                status: (getEnvVar('GEMINI_API_KEY') || getEnvVar('GOOGLE_API_KEY')) ? 'active' : 'inactive'
            },
            {
                id: 'openrouter',
                name: 'OpenRouter',
                description: 'Alternative LLM provider',
                status: getEnvVar('OPENROUTER_API_KEY') ? 'active' : 'inactive'
            },
            {
                id: 'groq',
                name: 'Groq',
                description: 'Fast inference provider',
                status: getEnvVar('GROQ_API_KEY') ? 'active' : 'inactive'
            },
            {
                id: 'brave',
                name: 'Brave Search',
                description: 'Web search & research capabilities',
                status: getEnvVar('BRAVE_API_KEY') ? 'active' : 'inactive'
            },
            {
                id: 'cartesia',
                name: 'Cartesia',
                description: 'Voice & Speech synthesis',
                status: getEnvVar('CARTESIA_API_KEY') ? 'active' : 'inactive'
            }
        ];

        return NextResponse.json({ connections });
    } catch (error) {
        console.error('Error fetching connections:', error);
        return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }
}
