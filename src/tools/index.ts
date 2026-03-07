import { FunctionDeclaration } from '@google/generative-ai';
import { getCurrentTimeGeminiDef, getCurrentTimeOpenAIDef, getCurrentTime } from './get-current-time.js';
import { rememberFactGeminiDef, rememberFactOpenAIDef, rememberFact } from './remember-fact.js';
import { recallMemoryGeminiDef, recallMemoryOpenAIDef, recallMemory } from './recall-memory.js';
import { updateHeartbeatScheduleGeminiDef, updateHeartbeatScheduleOpenAIDef, updateHeartbeatSchedule } from './update-heartbeat-schedule.js';
import { toggleTalkModeGeminiDef, toggleTalkModeOpenAIDef, toggleTalkMode } from './toggle-talk-mode.js';
import { mcpGeminiTools, mcpOpenAITools, mcpToolRouting, executeMCPTool } from '../mcp/client.js';

// The registry holding all tool definitions for Gemini (Static)
export const staticGeminiToolDeclarations: FunctionDeclaration[] = [
    getCurrentTimeGeminiDef,
    rememberFactGeminiDef,
    recallMemoryGeminiDef,
    updateHeartbeatScheduleGeminiDef,
    toggleTalkModeGeminiDef,
];

// The registry holding all tool definitions for OpenAI format (Static)
export const staticOpenAIToolDeclarations = [
    getCurrentTimeOpenAIDef,
    rememberFactOpenAIDef,
    recallMemoryOpenAIDef,
    updateHeartbeatScheduleOpenAIDef,
    toggleTalkModeOpenAIDef,
];

// Dynamic getters to combine static and MCP tools
export function getGeminiTools(): FunctionDeclaration[] {
    return [...staticGeminiToolDeclarations, ...mcpGeminiTools];
}

export function getOpenAITools(): any[] {
    return [...staticOpenAIToolDeclarations, ...mcpOpenAITools];
}

// Dispatcher function that maps the function name to the actual execution logic
export async function executeTool(name: string, args: Record<string, any> | string): Promise<string> {
    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;

    // Check if it's an MCP tool first
    if (mcpToolRouting[name]) {
        return await executeMCPTool(name, parsedArgs);
    }

    switch (name) {
        case 'get_current_time':
            return getCurrentTime();
        case 'remember_fact':
            return rememberFact(parsedArgs);
        case 'recall_memory':
            return await recallMemory(parsedArgs);
        case 'update_heartbeat_schedule':
            return await updateHeartbeatSchedule(parsedArgs);
        case 'toggle_talk_mode':
            return await toggleTalkMode(parsedArgs);
        default:
            throw new Error(`Tool ${name} is not registered`);
    }
}
