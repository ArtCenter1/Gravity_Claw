/**
 * Unified LLM Provider Interface
 * 
 * Supports: OpenAI, Anthropic, Google, DeepSeek, Groq, Ollama (local)
 */

import { FunctionDeclaration } from '@google/generative-ai';

// ============================================================================
// Types
// ============================================================================

export type LLMProviderType = 'openai' | 'anthropic' | 'google' | 'gemini' | 'deepseek' | 'groq' | 'ollama';

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_call_id?: string;
    tool_calls?: {
        id: string;
        type: 'function';
        function: {
            name: string;
            arguments: string;
        };
    }[];
}

export interface LLMTool {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: Record<string, any>;
    };
}

export interface LLMResponse {
    content: string;
    toolCalls?: {
        id: string;
        name: string;
        arguments: Record<string, any>;
    }[];
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface LLMProviderConfig {
    apiKey?: string;
    baseURL?: string;
    model?: string;
}

export interface LLMProvider {
    /**
     * The provider type identifier
     */
    readonly type: LLMProviderType;

    /**
     * The default model for this provider
     */
    readonly defaultModel: string;

    /**
     * Available models for this provider
     */
    readonly availableModels: string[];

    /**
     * Process a message and get a response
     */
    processMessage(
        messages: LLMMessage[],
        tools?: LLMTool[],
        systemInstruction?: string
    ): Promise<LLMResponse>;

    /**
     * Process a message with streaming (optional)
     */
    processMessageStream?(
        messages: LLMMessage[],
        tools?: LLMTool[],
        systemInstruction?: string
    ): AsyncGenerator<string, void, unknown>;
}

// ============================================================================
// Tool Format Converters
// ============================================================================

/**
 * Convert tool definitions to OpenAI format
 */
export function toOpenAITools(tools: FunctionDeclaration[]): LLMTool[] {
    return tools.map(tool => ({
        type: 'function' as const,
        function: {
            name: tool.name,
            description: tool.description || '',
            parameters: tool.parameters || { type: 'object', properties: {} },
        },
    }));
}

/**
 * Convert OpenAI format tools to Anthropic format
 */
export function toAnthropicTools(openAITools: LLMTool[]): any[] {
    return openAITools.map(tool => ({
        name: tool.function.name,
        description: tool.function.description,
        input_schema: tool.function.parameters,
    }));
}

// ============================================================================
// Provider Model Definitions
// ============================================================================

export interface ProviderModelInfo {
    id: string;
    name: string;
    provider: LLMProviderType;
    description: string;
    contextWindow: number;
    supportsTools: boolean;
    supportsVision: boolean;
}

export const PROVIDER_MODELS: Record<LLMProviderType, ProviderModelInfo[]> = {
    openai: [
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Latest GPT-4 with vision', contextWindow: 128000, supportsTools: true, supportsVision: true },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'Fast & cheap GPT-4', contextWindow: 128000, supportsTools: true, supportsVision: true },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', description: 'Previous GPT-4', contextWindow: 128000, supportsTools: true, supportsVision: true },
    ],
    anthropic: [
        { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', description: 'Latest Claude Sonnet', contextWindow: 200000, supportsTools: true, supportsVision: true },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', description: 'Fast & capable', contextWindow: 200000, supportsTools: true, supportsVision: true },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', description: 'Fast & cheap', contextWindow: 200000, supportsTools: true, supportsVision: true },
    ],
    google: [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', description: 'Fast Google model', contextWindow: 1000000, supportsTools: true, supportsVision: true },
        { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash', provider: 'google', description: 'Latest Flash preview', contextWindow: 1000000, supportsTools: true, supportsVision: true },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', description: 'High capability', contextWindow: 2000000, supportsTools: true, supportsVision: true },
    ],
    gemini: [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', description: 'Fast Google model', contextWindow: 1000000, supportsTools: true, supportsVision: true },
        { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash', provider: 'google', description: 'Latest Flash preview', contextWindow: 1000000, supportsTools: true, supportsVision: true },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', description: 'High capability', contextWindow: 2000000, supportsTools: true, supportsVision: true },
    ],
    deepseek: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek', description: 'DeepSeek V3', contextWindow: 64000, supportsTools: true, supportsVision: false },
        { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'deepseek', description: 'Code specialized', contextWindow: 160000, supportsTools: true, supportsVision: false },
    ],
    groq: [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'groq', description: 'Meta Llama via Groq', contextWindow: 128000, supportsTools: true, supportsVision: false },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'groq', description: 'Mistral via Groq', contextWindow: 32000, supportsTools: true, supportsVision: false },
    ],
    ollama: [
        { id: 'llama3', name: 'Llama 3', provider: 'ollama', description: 'Meta Llama 3 (local)', contextWindow: 8192, supportsTools: false, supportsVision: false },
        { id: 'mistral', name: 'Mistral', provider: 'ollama', description: 'Mistral (local)', contextWindow: 8192, supportsTools: false, supportsVision: false },
        { id: 'codellama', name: 'CodeLlama', provider: 'ollama', description: 'Code specialized (local)', contextWindow: 16384, supportsTools: false, supportsVision: false },
    ],
};

export function getAllModels(): ProviderModelInfo[] {
    return Object.values(PROVIDER_MODELS).flat();
}

export function getModelInfo(provider: LLMProviderType, modelId: string): ProviderModelInfo | undefined {
    return PROVIDER_MODELS[provider]?.find(m => m.id === modelId);
}
