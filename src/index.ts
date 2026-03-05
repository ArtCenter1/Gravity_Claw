import { bot } from './bot.js';

async function main() {
    console.log('Starting Gravity Claw...');

    bot.catch((err) => {
        console.error('Grammy Error:', err);
    });

    await bot.start({
        onStart: (botInfo) => {
            console.log(`Bot @${botInfo.username || botInfo.id} is running via long-polling exclusively!`);
        },
    });
}

process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());

main().catch(console.error);
