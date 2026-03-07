import { NextResponse } from 'next/server';
import { getMessages, getMessageCount, getTodayMessageCount } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');

        const messages = getMessages(limit);
        const totalCount = getMessageCount();
        const todayCount = getTodayMessageCount();

        // Calculate tool calls (estimate based on message content patterns)
        const toolCallPatterns = ['recall_memory', 'remember_fact', 'get_current_time', 'toggle_talk_mode', 'update_heartbeat'];
        let toolCallCount = 0;
        messages.forEach(msg => {
            toolCallPatterns.forEach(pattern => {
                if (msg.content.toLowerCase().includes(pattern)) {
                    toolCallCount++;
                }
            });
        });

        // Format messages for the activity feed
        const activityItems = messages.map(msg => ({
            id: msg.id,
            type: msg.role === 'user' ? 'message_received' : 'message_sent',
            title: msg.role === 'user' ? 'Message received' : 'Message sent',
            description: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
            time: formatTimeAgo(msg.timestamp),
            icon: msg.role === 'user' ? 'user' : 'bot',
        }));

        return NextResponse.json({
            messages: activityItems,
            stats: {
                totalMessages: totalCount,
                todayMessages: todayCount,
                toolCalls: toolCallCount,
                // For now, estimate uptime based on first message
                uptime: calculateUptime(messages),
            }
        });
    } catch (error) {
        console.error('Error fetching activity:', error);
        return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
    }
}

function formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

function calculateUptime(messages: Array<{ timestamp: string }>): string {
    if (messages.length === 0) return '0h';

    const firstMessage = messages[messages.length - 1];
    const startTime = new Date(firstMessage.timestamp).getTime();
    const now = Date.now();
    const hours = Math.floor((now - startTime) / (1000 * 60 * 60));

    if (hours < 1) return '<1h';
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}
