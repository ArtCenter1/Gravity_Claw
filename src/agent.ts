import { config } from './config.js';
import { getLLMProvider } from './llm/factory.js';
import { LLMMessage } from './llm/types.js';
import { addMessage, getRecentMessages, getRollingSummary } from './memory/buffer.js';
import { getFormattedFacts } from './memory/core.js';
import { checkAndCompactBuffer } from './memory/summary.js';
import { extractFactsInBackground } from './memory/extract-facts.js';
import { generateEmbedding } from './memory/embeddings.js';
import { saveToSemanticMemory, searchSemanticMemory } from './memory/semantic.js';
import { getSetting } from './memory/settings.js';
import { toOpenAITools } from './llm/types.js';
import { getOpenAITools } from './tools/index.js';

export async function processUserMessage(message: string): Promise<string> {
    // 1. Log user message to SQLite DB
    addMessage('user', message);

    // Background: Save to semantic memory
    generateEmbedding(message).then(embedding => {
        if (embedding) saveToSemanticMemory('user', message, embedding);
    });

    // 2. Fetch context
    const rollingSummary = getRollingSummary();
    const coreFacts = getFormattedFacts();
    const recentMessages = getRecentMessages();

    // Semantic Search (RAG) based on current user message
    let semanticMemoryContext = "";
    const queryEmbedding = await generateEmbedding(message);
    if (queryEmbedding) {
        const relevantHistory = await searchSemanticMemory(queryEmbedding, 3);
        if (relevantHistory.length > 0) {
            semanticMemoryContext = relevantHistory.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n');
        }
    }

    // Create an injected context header to attach to the user message
    let injectedContext = "";
    if (coreFacts) {
        injectedContext += `### CORE FACTS ABOUT USER ###\n${coreFacts}\n\n`;
    }
    if (rollingSummary) {
        injectedContext += `### ROLLING SUMMARY OF OLDER CONVERSATION ###\n${rollingSummary}\n\n`;
    }
    if (semanticMemoryContext) {
        injectedContext += `### RELEVANT PAST CONVERSATIONS (Semantic Search) ###\n${semanticMemoryContext}\n\n`;
    }
    if (recentMessages.length > 0) {
        const historyText = recentMessages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n');
        injectedContext += `### RECENT CONVERSATION HISTORY ###\n${historyText}\n\n`;
    }

    // 4. Time and Mode Context
    const currentTime = new Date().toLocaleString();
    const isTalkMode = getSetting('talk_mode', 'off') === 'on';

    let modeInstructions = `[Current Time: ${currentTime}]\n`;
    if (isTalkMode) {
        modeInstructions += `### TALK MODE IS ACTIVE ###\n`;
        modeInstructions += `1. Response Style: VERY CONCISE, short, and punchy. Avoid long paragraphs.\n`;
        modeInstructions += `2. Primary Output: VOICE. Your words will be read aloud, so make them flow naturally for speech.\n`;
        modeInstructions += `3. Acknowledge user's presence, but don't restate what they said unless asked.\n\n`;
    }

    // The system prompt now contains the context and mode instructions
    const systemInstruction = `
 ${modeInstructions}
 ${injectedContext}
    `.trim();

    // 5. Get the LLM provider and process the message
    const provider = getLLMProvider();

    // getOpenAITools() returns tools in the unified LLMTool format (OpenAI-compatible)
    const tools = getOpenAITools();

    // Build messages
    const messages: LLMMessage[] = [
        { role: 'user', content: message }
    ];

    // Process with the unified provider interface
    const response = await provider.processMessage(
        messages,
        tools.length > 0 ? tools : undefined,
        systemInstruction
    );

    // 3. Log assistant response to DB
    addMessage('assistant', response.content);

    // Background: Save assistant response to semantic memory
    generateEmbedding(response.content).then(embedding => {
        if (embedding) saveToSemanticMemory('assistant', response.content, embedding);
    });

    // 4. Trigger background async processes (fire and forget)
    Promise.all([
        checkAndCompactBuffer(),
        extractFactsInBackground()
    ]).catch(console.error);

    return response.content;
}
