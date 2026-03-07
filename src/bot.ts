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
    const configuredProviders = getConfiguredProviders();
    const currentProvider = getCurrentProviderType();

    // Flatten all available models into a single list
    const allOptions: { provider: LLMProviderType; model: string; label: string }[] = [];
    for (const p of configuredProviders) {
        if (!p.hasKey && p.type !== 'ollama' && p.type !== 'failover') continue;

        const models = getModelsForProvider(p.type);
        for (const mId of models) {
            allOptions.push({
                provider: p.type,
                model: mId,
                label: `${p.name} - ${mId}`
            });
        }
    }

    if (args.length === 0) {
        let msg = `🤖 **Current Model Selection**\n\n`;
        msg += `Pick a number to hot-swap:\n\n`;

        allOptions.forEach((opt, i) => {
            const isSelected = opt.provider === currentProvider; // Rough check
            msg += `${i + 1}. ${isSelected ? '✅ ' : ''}${opt.label}\n`;
        });

        msg += `\nUsage: \`/model <number>\` or \`/model <provider> [model]\``;
        await ctx.reply(msg, { parse_mode: 'Markdown' });
        return;
    }

    let targetProvider: LLMProviderType | undefined;
    let targetModel: string | undefined;

    // Check if it's a number
    const selectionIndex = parseInt(args[0]) - 1;
    if (!isNaN(selectionIndex) && allOptions[selectionIndex]) {
        const selection = allOptions[selectionIndex];
        targetProvider = selection.provider;
        targetModel = selection.model;
    } else {
        // Fallback to provider/model text search
        targetProvider = args[0].toLowerCase() as LLMProviderType;
        targetModel = args[1];

        const providerConfig = configuredProviders.find(p => p.type === targetProvider);
        if (!providerConfig) {
            await ctx.reply(`❌ Unknown selection. Use a number or a valid provider name.`);
            return;
        }

        if (!providerConfig.hasKey && targetProvider !== 'ollama' && targetProvider !== 'failover') {
            await ctx.reply(`❌ No API key configured for ${providerConfig.name}.`);
            return;
        }
    }

    // Switch provider
    try {
        switchProvider(targetProvider, targetModel);
        await ctx.reply(`✅ Successfully switched to **${targetProvider.toUpperCase()}**${targetModel ? ` (${targetModel})` : ''}!`);
    } catch (error: any) {
        await ctx.reply(`❌ Failed to switch: ${error.message}`);
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
