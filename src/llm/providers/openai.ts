/**
 * OpenAI LLM Provider
 * 
 * Supports: OpenAI, DeepSeek, Groq, and any OpenAI-compatible API
 */

import OpenAI from 'openai';
import { LLMProvider, LLMMessage, LLMTool, LLMResponse, LLMProviderType } from '../types.js';
import { PROVIDER_MODELS } from '../types.js';
import { loadSoulContent, getBaseSystemInstruction, agentLoop } from '../base.js';

export class OpenAIProvider implements LLMProvider {
    readonly type: LLMProviderType = 'openai';
    readonly defaultModel = 'gpt-4o-mini';
    readonly availableModels: string[];

    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model?: string, baseURL?: string) {
        this.client = new OpenAI({
            apiKey,
            baseURL: baseURL || 'https://api.openai.com/v1',
        });
        this.model = model || this.defaultModel;
        this.availableModels = PROVIDER_MODELS.openai.map(m => m.id);
    }

    setModel(model: string): void {
        if (this.availableModels.includes(model)) {
            this.model = model;
        } else {
            console.warn(`Model ${model} not found for OpenAI, keeping ${this.model}`);
        }
    }

    getModel(): string {
        return this.model;
    }

    async processMessage(
        messages: LLMMessage[],
        tools?: LLMTool[],
        systemInstruction?: string
    ): Promise<LLMResponse> {
        const soulContent = loadSoulContent();
        const baseSystem = getBaseSystemInstruction(soulContent);

        // Build messages with system instruction
        const fullMessages: any[] = [];

        if (systemInstruction || baseSystem) {
            fullMessages.push({
                role: 'system',
                content: [baseSystem, systemInstruction].filter(Boolean).join('\n\n'),
            });
        }

        // Convert LLMMessage to OpenAI format
        for (const msg of messages) {
            if (msg.role === 'system' && fullMessages.some(m => m.role === 'system')) {
                continue; // Skip duplicate system
            }

            const openaiMsg: any = {
                role: msg.role,
                content: msg.content,
            };

            if (msg.tool_calls && msg.tool_calls.length > 0) {
                openaiMsg.tool_calls = msg.tool_calls.map(tc => ({
                    id: tc.id,
                    type: 'function',
                    function: {
                        name: tc.function.name,
                        arguments: tc.function.arguments,
                    },
                }));
            }

            if (msg.tool_call_id) {
                openaiMsg.tool_call_id = msg.tool_call_id;
            }

            fullMessages.push(openaiMsg);
        }

        // Run agent loop
        const result = await agentLoop(
            async (msgs, toolDefs) => {
                const response = await this.client.chat.completions.create({
                    model: this.model,
                    messages: msgs as any,
                    tools: toolDefs as any,
                    tool_choice: 'auto',
                });

                const choice = response.choices[0];
                const msg = choice.message;

                return {
                    content: msg.content || '',
                    toolCalls: msg.tool_calls?.map((tc: any) => ({
                        id: tc.id,
                        name: tc.function.name,
                        arguments: tc.function.arguments,
                    })),
                    usage: response.usage ? {
                        promptTokens: response.usage.prompt_tokens,
                        completionTokens: response.usage.completion_tokens,
                        totalTokens: response.usage.total_tokens,
                    } : undefined,
                };
            },
            fullMessages as any,
            tools
        );

        return { content: result };
    }
}
