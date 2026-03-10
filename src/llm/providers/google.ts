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

        // Map types to uppercase as required by Google Gemini API
        const typeMap: Record<string, string> = {
            'string': 'STRING',
            'number': 'NUMBER',
            'integer': 'INTEGER',
            'boolean': 'BOOLEAN',
            'array': 'ARRAY',
            'object': 'OBJECT',
        };

        let type = params.type;
        // Handle array types (common in JSON Schema but not Gemini)
        if (Array.isArray(type)) {
            type = type.find(t => t !== 'null') || type[0];
        }

        if (type && typeof type === 'string') {
            const mappedType = typeMap[type.toLowerCase()] || type.toUpperCase();
            if (Object.values(typeMap).includes(mappedType)) {
                result.type = mappedType;
            } else {
                result.type = 'STRING';
            }
        } else if (params.properties) {
            result.type = 'OBJECT';
        } else if (params.items) {
            result.type = 'ARRAY';
        } else {
            result.type = 'STRING';
        }
        
        if (params.description) result.description = params.description;

        if (params.properties) {
            result.properties = {};
            for (const [key, prop] of Object.entries(params.properties)) {
                result.properties[key] = this.sanitizeParameters(prop);
            }
        }
        
        if (params.required && Array.isArray(params.required)) {
            result.required = params.required;
        }

        if (params.enum) result.enum = params.enum;

        // Handle array items
        if (params.items) {
            result.items = this.sanitizeParameters(params.items);
            if (!result.items.type) {
                result.items.type = 'STRING';
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

        // Convert tools to Gemini format
        const geminiTools = tools?.map(tool => {
            const cleanParams = this.sanitizeParameters(tool.function.parameters);
            
            // Ensure name is valid according to Gemini rules ([a-zA-Z0-9_-])
            const validName = tool.function.name.replace(/[^a-zA-Z0-9_-]/g, '_');
            
            const declaration = {
                name: validName,
                description: tool.function.description || `Tool ${validName}`,
                parameters: cleanParams,
            };
            
            // Log declaration for debugging (only if needed, but useful now)
            // console.log(`[Gemini] Tool: ${validName}`, JSON.stringify(cleanParams));
            
            return declaration;
        }).filter(t => !!t.name) || [];

        // console.log(`[Gemini] Registered ${geminiTools.length} tools`);

        const chatConfig: any = {
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

        // Send full history to startChat if we had it, but for simple processMessage we just take the last
        // user message for the first prompt.
        const userMessages = messages.filter(m => m.role === 'user');
        const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';

        let nextPrompt: string | Part[] | (string | Part)[] = lastUserMessage;

        for (let i = 0; i < MAX_ITERATIONS; i++) {
            try {
                const result = await chat.sendMessage(nextPrompt);
                const response = result.response;
                const functionCalls = response.functionCalls();

                if (functionCalls && functionCalls.length > 0) {
                    const parts: Part[] = [];
                    
                    for (const call of functionCalls) {
                        console.log(`[Google] Model calling function: ${call.name}`);
                        const toolResultStr = await executeTool(call.name, call.args || {});
                        
                        parts.push({
                            functionResponse: {
                                name: call.name,
                                response: { result: toolResultStr },
                            },
                        });
                    }
                    
                    nextPrompt = parts;
                } else {
                    return { content: response.text() };
                }
            } catch (error: any) {
                console.error(`[Google] API Error:`, error);
                if (error.message?.includes('400') || error.message?.includes('Failed to call a function')) {
                    throw new Error(`400 Failed to call a function. This usually means the model generated invalid tool parameters or the tool schema is being rejected by Gemini.`);
                }
                throw error;
            }
        }

        return { content: "Error: Maximum agent iterations reached." };
    }
}
