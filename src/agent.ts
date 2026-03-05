import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { config } from './config.js';
import { timeToolDef, getCurrentTime } from './tools/time.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: "You are Gravity Claw, a helpful and secure personal AI assistant. Keep responses clear and concise.",
    tools: [{ functionDeclarations: [timeToolDef] }],
});

const MAX_ITERATIONS = 5;

export async function processUserMessage(message: string): Promise<string> {
    const chat = model.startChat({
        history: [],
    });

    let currentMessage: string | Part[] = message;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const result = await chat.sendMessage(currentMessage);
        const response = result.response;

        const functionCalls = response.functionCalls();

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0]; // Process only the first tool call for simplicity now

            let toolResultStr = '';
            if (call.name === 'get_current_time') {
                toolResultStr = getCurrentTime();
            } else {
                toolResultStr = 'Unknown tool called.';
            }

            // Send tool result back to the model
            currentMessage = [{
                functionResponse: {
                    name: call.name,
                    response: { result: toolResultStr }
                }
            }];
        } else {
            return response.text();
        }
    }

    return "Error: Maximum agent iterations reached. Potential loop detected.";
}
