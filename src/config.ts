import 'dotenv/config';
import { LLMProviderType } from './llm/types.js';

interface Config {
    telegramBotToken: string;
    telegramAllowedUserId: number;
    llmProvider: LLMProviderType;
    llmModel: string;
    llmFailoverPriority: LLMProviderType[];

    // API Keys
    openaiApiKey?: string;
    anthropicApiKey?: string;
    geminiApiKey?: string;
    deepseekApiKey?: string;
    groqApiKey?: string;
    ollamaBaseURL?: string;
    openrouterApiKey?: string;

    // Other services
    cartesiaApiKey?: string;
    supabaseUrl?: string;
    supabaseServiceKey?: string;
}

const rawConfig = {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramAllowedUserId: Number(process.env.TELEGRAM_ALLOWED_USER_ID),
    llmProvider: (process.env.LLM_PROVIDER || 'google') as LLMProviderType,
    llmModel: process.env.LLM_MODEL || '',
    llmFailoverPriority: (process.env.LLM_FAILOVER_PRIORITY?.split(',') || ['anthropic', 'openai', 'google', 'groq']) as LLMProviderType[],

    // API Keys
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    groqApiKey: process.env.GROQ_API_KEY,
    ollamaBaseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    openrouterApiKey: process.env.OPENROUTER_API_KEY,

    // Other services
    cartesiaApiKey: process.env.CARTESIA_API_KEY,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
};

if (!rawConfig.telegramBotToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is missing in environment variables');
}
if (!rawConfig.telegramAllowedUserId || isNaN(rawConfig.telegramAllowedUserId)) {
    throw new Error('TELEGRAM_ALLOWED_USER_ID is missing or invalid in environment variables');
}

// Validate that the selected provider has an API key
function getProviderApiKey(provider: LLMProviderType): string | undefined {
    switch (provider) {
        case 'openai': return rawConfig.openaiApiKey;
        case 'anthropic': return rawConfig.anthropicApiKey;
        case 'gemini':
        case 'google': return rawConfig.geminiApiKey;
        case 'deepseek': return rawConfig.deepseekApiKey;
        case 'groq': return rawConfig.groqApiKey;
        case 'ollama': return rawConfig.ollamaBaseURL; // Ollama doesn't need API key
        case 'openrouter': return rawConfig.openrouterApiKey;
        default: return undefined;
    }
}

const selectedProviderApiKey = getProviderApiKey(rawConfig.llmProvider);
if (!selectedProviderApiKey && rawConfig.llmProvider !== 'ollama') {
    console.warn(`⚠️ No API key found for provider: ${rawConfig.llmProvider}`);
}

if (!rawConfig.cartesiaApiKey) {
    console.warn('⚠️ CARTESIA_API_KEY is missing. TTS will not work.');
}
if (!rawConfig.supabaseUrl || !rawConfig.supabaseServiceKey) {
    console.warn('⚠️ SUPABASE_URL or SUPABASE_SERVICE_KEY is missing. Semantic Memory will be disabled.');
}

export const config: Config = {
    telegramBotToken: rawConfig.telegramBotToken,
    telegramAllowedUserId: rawConfig.telegramAllowedUserId,
    llmProvider: rawConfig.llmProvider,
    llmModel: rawConfig.llmModel,
    llmFailoverPriority: rawConfig.llmFailoverPriority,
    openaiApiKey: rawConfig.openaiApiKey,
    anthropicApiKey: rawConfig.anthropicApiKey,
    geminiApiKey: rawConfig.geminiApiKey,
    deepseekApiKey: rawConfig.deepseekApiKey,
    groqApiKey: rawConfig.groqApiKey,
    ollamaBaseURL: rawConfig.ollamaBaseURL,
    openrouterApiKey: rawConfig.openrouterApiKey,
    cartesiaApiKey: rawConfig.cartesiaApiKey,
    supabaseUrl: rawConfig.supabaseUrl,
    supabaseServiceKey: rawConfig.supabaseServiceKey,
};

// Export provider API keys getter
export function getProviderApiKeyByType(provider: LLMProviderType): string | undefined {
    return getProviderApiKey(provider);
}
