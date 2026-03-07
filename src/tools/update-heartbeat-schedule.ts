import { saveSetting } from '../memory/settings.js';
import { rescheduleHeartbeat } from '../heartbeat.js';
import { SchemaType } from '@google/generative-ai';

export const updateHeartbeatScheduleGeminiDef = {
    name: 'update_heartbeat_schedule',
    description: 'Updates the recurring schedule for morning briefings or afternoon check-ins.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            type: {
                type: SchemaType.STRING,
                enum: ['morning', 'afternoon'],
                description: 'Which schedule to update.'
            },
            cronExpression: {
                type: SchemaType.STRING,
                description: 'The standard cron expression (min hour dom month dow). Example: "0 9 * * *" for 9:00 AM.'
            }
        },
        required: ['type', 'cronExpression']
    }
};

export const updateHeartbeatScheduleOpenAIDef = {
    type: 'function',
    function: {
        name: 'update_heartbeat_schedule',
        description: 'Updates the recurring schedule for morning briefings or afternoon check-ins.',
        parameters: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: ['morning', 'afternoon'],
                    description: 'Which schedule to update.'
                },
                cronExpression: {
                    type: 'string',
                    description: 'The standard cron expression (min hour dom month dow). Example: "0 9 * * *" for 9:00 AM.'
                }
            },
            required: ['type', 'cronExpression']
        }
    }
};

export async function updateHeartbeatSchedule(args: any): Promise<string> {
    const { type, cronExpression } = args;

    const settingKey = type === 'morning' ? 'heartbeat_morning_cron' : 'heartbeat_afternoon_cron';
    saveSetting(settingKey, cronExpression);

    // Trigger immediate reschedule
    rescheduleHeartbeat();

    return `Successfully updated ${type} heartbeat schedule to: ${cronExpression}`;
}
