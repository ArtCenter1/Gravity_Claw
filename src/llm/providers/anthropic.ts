/**
 * Anthropic LLM Provider
 * 
 * Note: Requires @anthropic-ai/sdk to be installed
 */

import { LLMProvider, LLMMessage, LLMTool, LLMResponse, LLMProviderType } from '../types.js';
import { PROVIDER_MODELS } from '../types.js';
import { loadSoulContent, getBaseSystemInstruction } from '../base.js';
import { executeTool } from '../../tools/index.js';

const MAX_ITERATIONS = 10;

export class AnthropicProvider implements LLMProvider {
    readonly type: LLMProviderType = 'anthropic';
    readonly defaultModel = 'claude-sonnet-4-20250514';
    readonly availableModels: string[];

    private apiKey: string;
    private model: string;
    private client: any;

    constructor(apiKey: string, model?: string) {
        this.apiKey = apiKey;
        this.model = model || this.defaultModel;
        this.availableModels = PROVIDER_MODELS.anthropic.map(m => m.id);

        // Lazy load the SDK
        try {
            const Anthropic = require('@anthropic-ai/sdk');
            this.client = new Anthropic({ apiKey });
        } catch (e) {
            console.error('Failed to load Anthropic SDK. Run: npm install @anthropic-ai/sdk');
            throw new Error('Anthropic SDK not installed. Run: npm install @anthropic-ai/sdk');
        }
    }

    setModel(model: string): void {
        if (this.availableModels.includes(model)) {
            this.model = model;
        } else {
            console.warn(`Model ${model} not found for Anthropic, keeping ${this.model}`);
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

        const systemContent = [baseSystem, systemInstruction]
            .filter(Boolean)
            .join('\n\n');

        // Get last user message
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();

        if (!lastUserMessage) {
            return { content: 'No user message found' };
        }

        let currentContent: any[] = [
            {
                role: 'user',
                content: lastUserMessage.content,
            }
        ];

        for (let i = 0; i < MAX_ITERATIONS; i++) {
            try {
                const response: any = await this.client.messages.create({
                    model: this.model,
                    max_tokens: 4096,
                    system: systemContent,
                    messages: currentContent,
                    tools: tools ? tools.map(t => ({
                        name: t.function.name,
                        description: t.function.description,
                        input_schema: t.function.parameters,
                    })) : undefined,
                });

                // Check for tool use
                const toolUses = response.content.filter((block: any) => block.type === 'tool_use');

                if (toolUses.length > 0) {
                    // Add assistant message with tool calls
                    currentContent.push({
                        role: 'assistant',
                        content: response.content,
                    });

                    // Execute tools and add results
                    for (const toolUse of toolUses) {
                        const toolResultStr = await executeTool(
                            toolUse.name,
                            toolUse.input
                        );

                        currentContent.push({
                            role: 'user',
                            content: [
                                {
                                    type: 'tool_result',
                                    tool_use_id: toolUse.id,
                                    content: toolResultStr,
                                }
                            ],
                        });
                    }
                } else {
                    // No tool calls, return the text response
                    const textContent = response.content.find((block: any) => block.type === 'text');
                    return {
                        content: textContent?.text || '',
                        usage: {
                            promptTokens: response.usage.input_tokens,
                            completionTokens: response.usage.output_tokens,
                            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
                        }
                    };
                }
            } catch (error: any) {
                console.error('Anthropic API error:', error);
                return { content: `Error: ${error.message}` };
            }
        }

        return { content: "Error: Maximum agent iterations (10) reached. Potential loop detected." };
    }
}
