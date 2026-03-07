import { saveSetting } from '../memory/settings.js';
import { SchemaType } from '@google/generative-ai';

export const toggleTalkModeGeminiDef = {
    name: 'toggle_talk_mode',
    description: 'Enables or disables "Talk Mode". When ON, the AI will respond primarily via voice and with more concise, conversational language.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            enabled: {
                type: SchemaType.BOOLEAN,
                description: 'Whether Talk Mode should be on or off.'
            }
        },
        required: ['enabled']
    }
};

export const toggleTalkModeOpenAIDef = {
    type: 'function',
    function: {
        name: 'toggle_talk_mode',
        description: 'Enables or disables "Talk Mode". When ON, the AI will respond primarily via voice and with more concise, conversational language.',
        parameters: {
            type: 'object',
            properties: {
                enabled: {
                    type: 'boolean',
                    description: 'Whether Talk Mode should be on or off.'
                }
            },
            required: ['enabled']
        }
    }
};

export async function toggleTalkMode(args: any): Promise<string> {
    const { enabled } = args;
    saveSetting('talk_mode', enabled ? 'on' : 'off');
    return `Talk Mode is now ${enabled ? 'ENABLED' : 'DISABLED'}. ${enabled ? 'I will now respond to you primarily with voice messages.' : 'I am back in standard text mode.'}`;
}
