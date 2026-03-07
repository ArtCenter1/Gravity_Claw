import { Bot, InputFile } from 'grammy';
import { config } from './config.js';
import { processUserMessage } from './agent.js';
import { transcribeAudio } from './transcribe.js';
import { generateSpeech } from './tts.js';
import { getSetting, saveSetting } from './memory/settings.js';
import { switchProvider, getCurrentProviderType, getConfiguredProviders, getModelsForProvider } from './llm/factory.js';
import { LLMProviderType } from './llm/types.js';

export const bot = new Bot(config.telegramBotToken);

bot.use(async (ctx, next) => {
    if (ctx.from?.id !== config.telegramAllowedUserId) {
        console.warn(`[Security] Unauthorized access attempt from user ID: ${ctx.from?.id}. Expected: ${config.telegramAllowedUserId}`);
        await ctx.reply(`Unauthorized. Your ID: ${ctx.from?.id}`);
        return;
    }
    await next();
});

bot.command('start', async (ctx) => {
    await ctx.reply('Hello! I am Gravity Claw. I am ready to assist you safely.');
});

bot.command('talk', async (ctx) => {
    const currentMode = getSetting('talk_mode', 'off');
    const newMode = currentMode === 'on' ? 'off' : 'on';
    saveSetting('talk_mode', newMode);
    await ctx.reply(`🎙️ Talk Mode is now **${newMode.toUpperCase()}**.`);
});

bot.command('model', async (ctx) => {
    const message = ctx.message;
    if (!message) return;

    const args = message.text.split(' ').slice(1);
    const currentProvider = getCurrentProviderType();
    const configuredProviders = getConfiguredProviders();

    if (args.length === 0) {
        // Show current model and available options
        let message = `🤖 Current LLM Provider: **${currentProvider.toUpperCase()}**\n\n`;
        message += `Available providers:\n`;

        for (const p of configuredProviders) {
            const status = p.hasKey ? '✅' : '❌';
            const selected = p.type === currentProvider ? ' *(selected)*' : '';
            message += `${status} ${p.name}${selected}\n`;
        }

        message += `\nTo switch, use: /model <provider> [model]`;
        message += `\nExample: /model openai gpt-4o-mini`;

        await ctx.reply(message, { parse_mode: 'Markdown' });
        return;
    }

    const newProvider = args[0].toLowerCase() as LLMProviderType;
    const newModel = args[1];

    // Validate provider
    const providerConfig = configuredProviders.find(p => p.type === newProvider);
    if (!providerConfig) {
        await ctx.reply(`Unknown provider: ${args[0]}\n\nAvailable: openai, anthropic, google, deepseek, groq, ollama`);
        return;
    }

    if (!providerConfig.hasKey && newProvider !== 'ollama') {
        await ctx.reply(`❌ No API key configured for ${providerConfig.name}.\nAdd it to your environment variables.`);
        return;
    }

    // Validate model if provided
    if (newModel) {
        const availableModels = getModelsForProvider(newProvider);
        if (!availableModels.includes(newModel)) {
            await ctx.reply(`Model "${newModel}" not available for ${providerConfig.name}.\n\nAvailable models:\n${availableModels.join('\n')}`);
            return;
        }
    }

    // Switch provider
    try {
        switchProvider(newProvider, newModel);
        const newProviderType = getCurrentProviderType();
        await ctx.reply(`✅ Switched to **${newProviderType.toUpperCase()}**${newModel ? ` (${newModel})` : ''}!`);
    } catch (error: any) {
        await ctx.reply(`Failed to switch provider: ${error.message}`);
    }
});

bot.on('message:voice', async (ctx) => {
    await ctx.replyWithChatAction('record_voice');

    try {
        const file = await ctx.getFile();
        if (!file.file_path) throw new Error('Could not get file path from Telegram');

        const url = `https://api.telegram.org/file/bot${config.telegramBotToken}/${file.file_path}`;
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const transcribedText = await transcribeAudio(buffer, 'ogg');

        // Check talk mode
        const isTalkMode = getSetting('talk_mode', 'off') === 'on';

        if (!isTalkMode) {
            await ctx.reply(`🎤 You said: "${transcribedText}"`);
        }

        // Process it with the LLM
        await ctx.replyWithChatAction(isTalkMode ? 'record_voice' : 'typing');

        const responseText = await processUserMessage(transcribedText);

        if (isTalkMode) {
            // Voice response ONLY in talk mode (pithy)
            await ctx.replyWithChatAction('record_voice');
            const audioBuffer = await generateSpeech(responseText);
            await ctx.replyWithVoice(new InputFile(audioBuffer, 'voice.mp3'));
        } else {
            // Standard Text + Optional Voice
            await ctx.reply(responseText);
            if (config.cartesiaApiKey) {
                await ctx.replyWithChatAction('record_voice');
                const audioBuffer = await generateSpeech(responseText);
                await ctx.replyWithVoice(new InputFile(audioBuffer, 'voice.mp3'));
            }
        }

    } catch (err: any) {
        console.error('Error processing voice message:', err);
        await ctx.reply(`Sorry, an error occurred with your voice message: ${err.message}`);
    }
});

bot.on('message:text', async (ctx) => {
    const userText = ctx.message.text;
    const isTalkMode = getSetting('talk_mode', 'off') === 'on';

    await ctx.replyWithChatAction('typing');

    try {
        const responseText = await processUserMessage(userText);

        if (isTalkMode) {
            // Voice response in talk mode
            await ctx.replyWithChatAction('record_voice');
            const audioBuffer = await generateSpeech(responseText);
            await ctx.replyWithVoice(new InputFile(audioBuffer, 'voice.mp3'));
        } else {
            // Standard Text + Optional Voice
            await ctx.reply(responseText);
            if (config.cartesiaApiKey) {
                await ctx.replyWithChatAction('record_voice');
                const audioBuffer = await generateSpeech(responseText);
                await ctx.replyWithVoice(new InputFile(audioBuffer, 'voice.mp3'));
            }
        }
    } catch (err: any) {
        console.error('Error processing message:', err);
        await ctx.reply(`Sorry, an error occurred while processing your request: ${err.message}`);
    }
});
