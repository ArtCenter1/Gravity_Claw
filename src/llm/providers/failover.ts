/**
 * Failover LLM Provider
 * 
 * Wraps multiple providers and automatically fails over to the next one on error.
 */

import { LLMProvider, LLMMessage, LLMTool, LLMResponse, LLMProviderType } from '../types.js';
import { config } from '../../config.js';

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

    setModel(model: string): void {
        // Update all providers in the chain
        this.providers.forEach(p => p.setModel(model));
    }

    getModel(): string {
        // Return model of first provider as current best represention
        return this.providers[0].getModel();
    }

    async processMessage(
        messages: LLMMessage[],
        tools?: LLMTool[],
        systemInstruction?: string
    ): Promise<LLMResponse> {
        let lastError: any = null;

        for (const provider of this.providers) {
            try {
                console.log(`[Failover] Attempting with provider: ${provider.type} (timeout: ${config.llmFailoverTimeout / 1000}s)`);

                // Race the provider request against a timeout promise
                const result = await Promise.race([
                    provider.processMessage(messages, tools, systemInstruction),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error(`Timeout after ${config.llmFailoverTimeout / 1000}s`)), config.llmFailoverTimeout)
                    )
                ]);

                return result;
            } catch (error: any) {
                console.warn(`[Failover] Provider ${provider.type} failed or timed out: ${error.message}`);
                lastError = error;
                // Move to next provider
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
