import 'dotenv/config';

interface Config {
    telegramBotToken: string;
    telegramAllowedUserId: number;
    geminiApiKey: string;
}

const rawConfig = {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramAllowedUserId: Number(process.env.TELEGRAM_ALLOWED_USER_ID),
    geminiApiKey: process.env.GEMINI_API_KEY,
};

if (!rawConfig.telegramBotToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is missing in environment variables');
}
if (!rawConfig.telegramAllowedUserId || isNaN(rawConfig.telegramAllowedUserId)) {
    throw new Error('TELEGRAM_ALLOWED_USER_ID is missing or invalid in environment variables');
}
if (!rawConfig.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is missing in environment variables');
}

export const config: Config = {
    telegramBotToken: rawConfig.telegramBotToken,
    telegramAllowedUserId: rawConfig.telegramAllowedUserId,
    geminiApiKey: rawConfig.geminiApiKey,
};
