import cron from 'node-cron';
import { bot } from './bot.js';
import { config } from './config.js';
import { getRecentMessages, getRollingSummary } from './memory/buffer.js';
import { getFormattedFacts } from './memory/core.js';
import { getSetting, saveSetting } from './memory/settings.js';
import { getLLMProvider } from './llm/factory.js';
import { LLMMessage } from './llm/types.js';

let morningJob: cron.ScheduledTask | null = null;
let afternoonJob: cron.ScheduledTask | null = null;

export function setupHeartbeat() {
    console.log('[Heartbeat] Proactive scheduling service started.');
    rescheduleHeartbeat();
}

export function rescheduleHeartbeat() {
    // 1. Stop existing jobs if any
    if (morningJob) morningJob.stop();
    if (afternoonJob) afternoonJob.stop();

    // 2. Fetch current schedules from DB or use defaults
    const morningCron = getSetting('heartbeat_morning_cron', '0 8 * * *');
    const afternoonCron = getSetting('heartbeat_afternoon_cron', '30 16 * * *');

    console.log(`[Heartbeat] Scheduling: Morning(${morningCron}), Afternoon(${afternoonCron})`);

    // 3. Schedule new jobs
    morningJob = cron.schedule(morningCron, async () => {
        console.log('[Heartbeat] Triggering morning briefing...');
        await sendMorningBriefing();
    });

    afternoonJob = cron.schedule(afternoonCron, async () => {
        console.log('[Heartbeat] Triggering afternoon check-in...');
        await sendAfternoonCheckIn();
    });
}

async function sendMorningBriefing() {
    const userId = config.telegramAllowedUserId;
    if (!userId) return;

    try {
        const facts = getFormattedFacts();
        const summary = await getRollingSummary();
        const recent = await getRecentMessages(10);

        const context = `
SYSTEM PROMPT (MODIFIED FOR BRIEFING): 
You are Gravity Claw. It is now 8:00 AM. 
Your goal is to send a proactive, helpful, and concise morning briefing to the user.
Look at the context below to see what you were talking about lately and if there are any pending tasks or topics.
Be constructive, casual, and proactive as per your soul.md.

CORE FACTS:
${facts}

ROLLING SUMMARY:
${summary}

RECENT MESSAGES:
${recent.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n')}
        `.trim();

        const briefingPrompt = "Waking up now. Provide a concise, proactive morning greeting and briefing based on our recent history. Keep it under 150 words.";

        // Use unified LLM provider
        const provider = getLLMProvider();
        const messages: LLMMessage[] = [{ role: 'user', content: `${context}\n\nUSER: ${briefingPrompt}` }];
        const response = await provider.processMessage(messages, undefined, context);

        await bot.api.sendMessage(userId, `☀️ **Morning Briefing**\n\n${response.content}`, { parse_mode: 'Markdown' });
        console.log('[Heartbeat] Morning briefing sent.');
    } catch (error) {
        console.error('[Heartbeat] Error sending morning briefing:', error);
    }
}

async function sendAfternoonCheckIn() {
    const userId = config.telegramAllowedUserId;
    if (!userId) return;

    try {
        const checkinPrompt = "It's 4:30 PM. Send a short, casual check-in message to see how my day is going or if there's anything you should help with before the evening.";

        // Use unified LLM provider
        const provider = getLLMProvider();
        const messages: LLMMessage[] = [{ role: 'user', content: checkinPrompt }];
        const response = await provider.processMessage(messages);

        await bot.api.sendMessage(userId, `👋 **Quick Check-in**\n\n${response.content}`, { parse_mode: 'Markdown' });
        console.log('[Heartbeat] Afternoon check-in sent.');
    } catch (error) {
        console.error('[Heartbeat] Error sending afternoon check-in:', error);
    }
}
