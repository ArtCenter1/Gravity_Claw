/**
 * LLM Provider Factory
 * 
 * Creates and manages LLM provider instances
 */

import { LLMProvider, LLMProviderType, PROVIDER_MODELS } from './types.js';
import { config, getProviderApiKeyByType } from '../config.js';
import { OpenAIProvider } from './providers/openai.js';
import { GoogleProvider } from './providers/google.js';
import { OpenRouterProvider } from './providers/openrouter.js';
import { FailoverProvider } from './providers/failover.js';

// Lazy-loaded providers (only import when needed)
let AnthropicProvider: any = null;
let DeepSeekProvider: any = null;
let GroqProvider: any = null;
let OllamaProvider: any = null;

// Current active provider instance
let currentProvider: LLMProvider | null = null;
let currentProviderType: LLMProviderType | null = null;

/**
 * Get or create the active LLM provider
 */
export function getLLMProvider(): LLMProvider {
    // Return cached provider if already initialized
    if (currentProvider && currentProviderType === config.llmProvider) {
        return currentProvider;
    }

    // Create new provider based on config
    currentProvider = createProvider(config.llmProvider, config.llmModel);
    currentProviderType = config.llmProvider;

    return currentProvider;
}

/**
 * Create a provider instance
 */
export function createProvider(
    providerType: LLMProviderType,
    model?: string
): LLMProvider {
    const apiKey = getProviderApiKeyByType(providerType);

    if (!apiKey && providerType !== 'ollama') {
        console.warn(`⚠️ No API key for ${providerType}, using Google as fallback`);
        providerType = 'google';
        // RE-FETCH API KEY FOR FALLBACK
        const fallbackKey = getProviderApiKeyByType('google');
        return new GoogleProvider(fallbackKey!, model || 'gemini-2.0-flash');
    }

    switch (providerType) {
        case 'openai':
            return new OpenAIProvider(apiKey!, model || 'gpt-4o-mini');

        case 'anthropic':
            // Lazy load Anthropic SDK
            if (!AnthropicProvider) {
                try {
                    AnthropicProvider = require('./providers/anthropic.js').AnthropicProvider;
                } catch (e) {
                    console.error('Anthropic SDK not installed. Run: npm install @anthropic-ai/sdk');
                    // Fallback to Google
                    return createProvider('google', model);
                }
            }
            return new AnthropicProvider(apiKey!, model || 'claude-sonnet-4-20250514');

        case 'google':
        case 'gemini':
            return new GoogleProvider(apiKey!, model || 'gemini-2.0-flash');

        case 'deepseek':
            // DeepSeek uses OpenAI-compatible API
            return new OpenAIProvider(
                apiKey!,
                model || 'deepseek-chat',
                'https://api.deepseek.com/v1'
            );

        case 'groq':
            // Groq uses OpenAI-compatible API
            return new OpenAIProvider(
                apiKey!,
                model || 'llama-3.3-70b-versatile',
                'https://api.groq.com/openai/v1'
            );

        case 'ollama':
            // Ollama uses OpenAI-compatible API with local URL
            const ollamaURL = config.ollamaBaseURL || 'http://localhost:11434';
            return new OpenAIProvider(
                'not-required', // Ollama doesn't need API key
                model || 'llama3',
                `${ollamaURL}/v1`
            );

        case 'openrouter':
            return new OpenRouterProvider(apiKey!, model || 'openai/gpt-4o');

        case 'failover':
            return getFailoverProvider();

        default:
            // Default to Google
            console.warn(`Unknown provider ${providerType}, defaulting to Google`);
            return new GoogleProvider(apiKey!, model || 'gemini-2.0-flash');
    }
}

/**
 * Create a failover provider with a default priority list
 */
export function getFailoverProvider(): LLMProvider {
    const providers: LLMProvider[] = [];

    // Use priority list from config
    const priorityList = config.llmFailoverPriority;

    for (const type of priorityList) {
        const apiKey = getProviderApiKeyByType(type);
        if (apiKey) {
            try {
                providers.push(createProvider(type));
            } catch (e) {
                console.warn(`[Factory] Failed to create provider ${type} for failover:`, e);
            }
        }
    }

    if (providers.length === 0) {
        // Absolute fallback to Google if no other keys found
        const googleKey = getProviderApiKeyByType('google');
        return new GoogleProvider(googleKey!, 'gemini-2.0-flash');
    }

    return new FailoverProvider(providers);
}

/**
 * Switch to a different provider at runtime
 */
export function switchProvider(providerType: LLMProviderType, model?: string): LLMProvider {
    console.log(`[LLM] Switching to ${providerType}${model ? ` (${model})` : ''}`);
    currentProvider = createProvider(providerType, model);
    currentProviderType = providerType;
    return currentProvider;
}

/**
 * Get the current provider type
 */
export function getCurrentProviderType(): LLMProviderType {
    return currentProviderType || config.llmProvider;
}

/**
 * Get available models for a provider
 */
export function getModelsForProvider(providerType: LLMProviderType): string[] {
    return PROVIDER_MODELS[providerType]?.map(m => m.id) || [];
}

/**
 * Get all available providers that have API keys configured
 */
export function getConfiguredProviders(): { type: LLMProviderType; name: string; hasKey: boolean }[] {
    return [
        { type: 'openai', name: 'OpenAI', hasKey: !!config.openaiApiKey },
        { type: 'anthropic', name: 'Anthropic (Claude)', hasKey: !!config.anthropicApiKey },
        { type: 'google', name: 'Google (Gemini)', hasKey: !!config.geminiApiKey },
        { type: 'deepseek', name: 'DeepSeek', hasKey: !!config.deepseekApiKey },
        { type: 'groq', name: 'Groq', hasKey: !!config.groqApiKey },
        { type: 'ollama', name: 'Ollama (Local)', hasKey: true }, // Local doesn't need API key
        { type: 'openrouter', name: 'OpenRouter', hasKey: !!config.openrouterApiKey },
        { type: 'failover', name: 'Model Failover', hasKey: true },
    ];
}
