/**
 * Failover LLM Provider
 * 
 * Wraps multiple providers and automatically fails over to the next one on error.
 */

import { LLMProvider, LLMMessage, LLMTool, LLMResponse, LLMProviderType } from '../types.js';

export class FailoverProvider implements LLMProvider {
    readonly type: LLMProviderType = 'failover';
    readonly defaultModel: string;
    readonly availableModels: string[] = [];

    private providers: LLMProvider[];

    constructor(providers: LLMProvider[]) {
        if (!providers || providers.length === 0) {
            throw new Error('FailoverProvider requires at least one provider');
        }
        this.providers = providers;
        this.defaultModel = providers[0].defaultModel;
        // Collect all available models from all providers
        this.availableModels = [...new Set(providers.flatMap(p => p.availableModels))];
    }

    async processMessage(
        messages: LLMMessage[],
        tools?: LLMTool[],
        systemInstruction?: string
    ): Promise<LLMResponse> {
        let lastError: any = null;

        for (const provider of this.providers) {
            try {
                console.log(`[Failover] Attempting with provider: ${provider.type}`);
                return await provider.processMessage(messages, tools, systemInstruction);
            } catch (error: any) {
                console.warn(`[Failover] Provider ${provider.type} failed: ${error.message}`);
                lastError = error;
                // Continue to next provider
            }
        }

        console.error('[Failover] All providers failed.');
        throw lastError || new Error('All providers in failover chain failed');
    }

    async *processMessageStream(
        messages: LLMMessage[],
        tools?: LLMTool[],
        systemInstruction?: string
    ): AsyncGenerator<string, void, unknown> {
        let lastError: any = null;

        for (const provider of this.providers) {
            if (!provider.processMessageStream) {
                // If provider doesn't support streaming, we might need to fall back to processMessage
                // but for now let's assume all primary providers will have it or we skip
                continue;
            }
            try {
                console.log(`[Failover] Attempting stream with provider: ${provider.type}`);
                yield* provider.processMessageStream(messages, tools, systemInstruction);
                return;
            } catch (error: any) {
                console.warn(`[Failover] Provider ${provider.type} stream failed: ${error.message}`);
                lastError = error;
            }
        }

        throw lastError || new Error('All providers in failover chain failed');
    }
}
