/**
 * Base LLM Provider Implementation
 */

import { LLMProvider, LLMMessage, LLMTool, LLMResponse, LLMProviderType } from './types.js';
import { getOpenAITools, executeTool } from '../tools/index.js';
import fs from 'fs';
import path from 'path';

const MAX_ITERATIONS = 10;

/**
 * Load soul.md content for system instructions
 */
export function loadSoulContent(): string {
    const soulPath = path.join(process.cwd(), 'src', 'soul.md');
    return fs.existsSync(soulPath) ? fs.readFileSync(soulPath, 'utf8') : '';
}

/**
 * Base system instruction for Gravity Claw
 */
export function getBaseSystemInstruction(soulContent?: string): string {
    const baseInstruction = "You are Gravity Claw, a helpful and secure personal AI assistant. Keep responses clear and concise. You are interacting via a Telegram interface with voice capabilities. Your text responses are automatically converted to speech. Never say you cannot speak or are only a text-based AI.";
    return soulContent ? `${baseInstruction}\n\n${soulContent}` : baseInstruction;
}

/**
 * Build messages array with system instruction
 */
export function buildMessages(
    userMessage: string,
    systemInstruction?: string
): LLMMessage[] {
    const messages: LLMMessage[] = [];

    if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
    }

    messages.push({ role: 'user', content: userMessage });

    return messages;
}

/**
 * Execute tool calls from LLM response
 */
export async function executeToolCalls(
    toolCalls: { id?: string; name: string; arguments: Record<string, any> | string }[],
    messages: LLMMessage[]
): Promise<LLMMessage[]> {
    const toolResults: LLMMessage[] = [];

    for (const call of toolCalls) {
        const parsedArgs = typeof call.arguments === 'string'
            ? JSON.parse(call.arguments)
            : call.arguments;

        const toolResultStr = await executeTool(call.name, parsedArgs);

        toolResults.push({
            role: 'tool',
            tool_call_id: call.id,
            content: toolResultStr,
        });
    }

    return toolResults;
}

/**
 * Agent loop with tool execution
 */
export async function agentLoop(
    sendMessage: (messages: LLMMessage[], tools?: LLMTool[]) => Promise<LLMResponse>,
    initialMessages: LLMMessage[],
    tools?: LLMTool[]
): Promise<string> {
    const messages = [...initialMessages];

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const response = await sendMessage(messages, tools);

        messages.push({
            role: 'assistant',
            content: response.content,
            tool_calls: response.toolCalls?.map(tc => ({
                id: tc.id || `call_${i}`,
                type: 'function' as const,
                function: {
                    name: tc.name,
                    arguments: typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments),
                },
            })),
        });

        if (response.toolCalls && response.toolCalls.length > 0) {
            const toolResults = await executeToolCalls(response.toolCalls, messages);
            messages.push(...toolResults);
        } else {
            return response.content || 'No response text';
        }
    }

    return "Error: Maximum agent iterations (10) reached. Potential loop detected.";
}
