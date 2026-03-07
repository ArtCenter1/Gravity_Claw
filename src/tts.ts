import { Cartesia } from '@cartesia/cartesia-js';
import { config } from './config.js';

let cartesia: Cartesia | null = null;

if (config.cartesiaApiKey) {
    cartesia = new Cartesia({
        apiKey: config.cartesiaApiKey,
    });
}

export async function generateSpeech(text: string): Promise<Buffer> {
    if (!cartesia) {
        throw new Error('CARTESIA_API_KEY is not configured for TTS.');
    }

    try {
        const response = await cartesia.tts.generate({
            model_id: "sonic-english",
            transcript: text,
            voice: {
                mode: "id",
                id: "e07c00bc-4134-4eae-9ea4-1a55fb45746b" // "Brooke - Big Sister" valid ID
            },
            output_format: {
                container: "mp3",
                bit_rate: 128000,
                sample_rate: 44100
            }
        });

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error("Cartesia TTS Error:", error);
        throw error;
    }
}
