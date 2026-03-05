import { Bot } from 'grammy';
import { config } from './config.js';
import { processUserMessage } from './agent.js';

export const bot = new Bot(config.telegramBotToken);

bot.use(async (ctx, next) => {
    if (ctx.from?.id !== config.telegramAllowedUserId) {
        console.warn(`Unauthorized access attempt from user ID: ${ctx.from?.id}`);
        return;
    }
    await next();
});

bot.command('start', async (ctx) => {
    await ctx.reply('Hello! I am Gravity Claw. I am ready to assist you safely.');
});

bot.on('message:text', async (ctx) => {
    const userText = ctx.message.text;

    await ctx.replyWithChatAction('typing');

    try {
        const responseText = await processUserMessage(userText);
        await ctx.reply(responseText);
    } catch (err: any) {
        console.error('Error processing message:', err);
        await ctx.reply(`Sorry, an error occurred while processing your request: ${err.message}`);
    }
});
