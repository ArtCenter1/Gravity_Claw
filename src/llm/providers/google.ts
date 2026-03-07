/**
 * Google Generative AI LLM Provider
 */

import { GoogleGenerativeAI, Part, Content } from '@google/generative-ai';
import { LLMProvider, LLMMessage, LLMTool, LLMResponse, LLMProviderType } from '../types.js';
import { PROVIDER_MODELS } from '../types.js';
import { loadSoulContent, getBaseSystemInstruction, executeToolCalls } from '../base.js';
import { getGeminiTools, executeTool } from '../../tools/index.js';

const MAX_ITERATIONS = 10;

export class GoogleProvider implements LLMProvider {
    readonly type: LLMProviderType = 'google';
    readonly defaultModel = 'gemini-2.0-flash';
    readonly availableModels: string[];

    private client: GoogleGenerativeAI;
    private model: string;

    constructor(apiKey: string, model?: string) {
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = model || this.defaultModel;
        this.availableModels = PROVIDER_MODELS.google.map(m => m.id);
    }

    setModel(model: string): void {
        if (this.availableModels.includes(model)) {
            this.model = model;
        } else {
            console.warn(`Model ${model} not found for Google, keeping ${this.model}`);
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

        const activeSystemInstruction = [baseSystem, systemInstruction]
            .filter(Boolean)
            .join('\n\n');

        const llm = this.client.getGenerativeModel({
            model: this.model,
            systemInstruction: activeSystemInstruction,
        });

        // Convert tools to Gemini format
        const geminiTools = tools?.map(tool => ({
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters as any,
        })) || [];

        const chatConfig: any = {
            history: [],
            generationConfig: {
                temperature: 0.9,
                topP: 1,
                topK: 1,
                maxOutputTokens: 2048,
            },
        };

        if (geminiTools.length > 0) {
            chatConfig.tools = [{ functionDeclarations: geminiTools }];
        }

        const chat = llm.startChat(chatConfig);

        // Find the last user message
        const userMessages = messages.filter(m => m.role === 'user');
        const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';

        let currentMessage: string | Part[] | Content[] = lastUserMessage;

        for (let i = 0; i < MAX_ITERATIONS; i++) {
            const result = await chat.sendMessage(currentMessage);
            const response = result.response;

            const functionCalls = response.functionCalls();

            if (functionCalls && functionCalls.length > 0) {
                const call = functionCalls[0];

                const toolResultStr = await executeTool(call.name, call.args || {});

                currentMessage = [{
                    functionResponse: {
                        name: call.name,
                        response: { result: toolResultStr },
                    },
                }];
            } else {
                return { content: response.text() };
            }
        }

        return { content: "Error: Maximum agent iterations (10) reached. Potential loop detected." };
    }
}
