import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/db';

export async function GET() {
    try {
        // In a real scenario, we'd check connectivity here.
        // For now, we check if keys/configs exist and return status.
        
        const connections = [
            {
                id: 'telegram',
                name: 'Telegram',
                description: 'Primary communication channel',
                status: process.env.TELEGRAM_BOT_TOKEN ? 'active' : 'inactive'
            },
            {
                id: 'supabase',
                name: 'Supabase',
                description: 'Semantic memory & real-time data',
                status: process.env.SUPABASE_URL ? 'active' : 'inactive'
            },
            {
                id: 'gemini',
                name: 'Google Gemini',
                description: 'LLM provider for AI responses',
                status: (process.env.LLM_PROVIDER === 'gemini' || !process.env.LLM_PROVIDER) && process.env.GOOGLE_API_KEY ? 'active' : 'inactive'
            },
            {
                id: 'openrouter',
                name: 'OpenRouter',
                description: 'Alternative LLM provider',
                status: process.env.OPENROUTER_API_KEY ? 'active' : 'inactive'
            },
            {
                id: 'groq',
                name: 'Groq',
                description: 'Fast inference provider',
                status: process.env.GROQ_API_KEY ? 'active' : 'inactive'
            }
        ];

        return NextResponse.json({ connections });
    } catch (error) {
        console.error('Error fetching connections:', error);
        return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }
}
