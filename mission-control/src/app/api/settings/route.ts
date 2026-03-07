import { NextResponse } from 'next/server';
import { getSettings, getSetting, setSetting } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const settings = getSettings();

        // Read soul.md for personality
        const soulPath = path.resolve('d:', 'My_Projects', 'Gravity_Claw', 'src', 'soul.md');
        let soulContent = '';
        try {
            soulContent = fs.readFileSync(soulPath, 'utf-8');
        } catch {
            soulContent = 'Personality not configured yet.';
        }

        // Convert settings array to object
        const settingsObj: Record<string, string> = {};
        settings.forEach(s => {
            settingsObj[s.key] = s.value;
        });

        return NextResponse.json({
            personality: soulContent,
            settings: settingsObj,
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { type, key, value } = await request.json();

        if (type === 'personality') {
            // Save personality to soul.md
            const soulPath = path.resolve('d:', 'My_Projects', 'Gravity_Claw', 'src', 'soul.md');
            fs.writeFileSync(soulPath, value);
            return NextResponse.json({ success: true });
        }

        if (type === 'setting' && key) {
            setSetting(key, value);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    } catch (error) {
        console.error('Error saving settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
