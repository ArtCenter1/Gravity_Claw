import OpenAI, { toFile } from 'openai';
import { config } from './config.js';

let openai: OpenAI | null = null;
if (config.groqApiKey) {
    openai = new OpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: config.groqApiKey
    });
}

export async function transcribeAudio(buffer: Buffer, fileExtension: string = 'ogg'): Promise<string> {
    if (!openai) {
        throw new Error('GROQ_API_KEY is not configured for voice transcription.');
    }

    const audioFile = await toFile(buffer, `audio.${fileExtension}`);

    const response = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3', // Groq's high-speed whisper model
    });

    return response.text;
}
