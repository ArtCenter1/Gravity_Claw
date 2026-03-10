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

    /**
     * Sanitize JSON Schema parameters to be compatible with Google Gemini
     * Removes: $schema, additionalProperties, any_of, etc.
     * Fixes: items without type field
     * 
     * KNOWN LIMITATIONS:
     * - anyOf/oneOf arrays are not fully supported
     * - definitions/$defs are not preserved
     * - custom formats are not preserved
     */
    private sanitizeParameters(params: any): any {
        if (!params) return undefined;
        if (typeof params !== 'object') return params;

        const result: any = {};

        // Copy allowed fields
        if (params.type) result.type = params.type;
        if (params.properties) {
            result.properties = {};
            for (const [key, prop] of Object.entries(params.properties)) {
                result.properties[key] = this.sanitizeParameters(prop);
            }
        }
        if (params.required) result.required = params.required;
        if (params.enum) result.enum = params.enum;

        // Handle array items - Google Gemini requires 'type' for items
        if (params.items) {
            result.items = this.sanitizeParameters(params.items);
            // Ensure items has a type - warn about implicit default
            if (!result.items.type) {
                console.warn(`GoogleProvider: Defaulting to 'string' type for array items. Consider explicitly defining the type in your JSON Schema.`);
                result.items.type = 'string';
            }
        }

        return result;
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

        // Convert tools to Gemini format - strip unsupported JSON Schema fields
        const geminiTools = tools?.map(tool => {
            // Deep clone and clean up parameters for Google Gemini
            const cleanParams = this.sanitizeParameters(tool.function.parameters);
            return {
                name: tool.function.name,
                description: tool.function.description,
                parameters: cleanParams,
            };
        }) || [];

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
