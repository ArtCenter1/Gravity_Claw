import { bot } from './bot.js';
import { db } from './db/sqlite.js';
import { config } from './config.js';
import { initializeMCPServers, closeMCPServers } from './mcp/client.js';
import { setupHeartbeat } from './heartbeat.js';

process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

const BANNER = `
   ___ravity      ___law   
  / _ \\        / __|    
 | (_| |______| (__     
  \\__, |______|\\___|    
   __/ |                
  |___/   Personal Agent
`;

async function main() {
    console.log(BANNER);
    console.log('Starting Gravity Claw...\n');

    bot.catch((err: any) => {
        console.error('Grammy Error:', err);
    });

    // Initialize local SQLite memory
    console.log('[SQLite] Local memory store initialized');

    // Initialize MCP Servers
    try {
        console.log('[System] Initializing MCP Servers...');
        await initializeMCPServers();
    } catch (e) {
        console.error('[System] MCP Initialization failed (non-fatal):', e);
    }

    // Start Heartbeat Service (Cron Jobs)
    try {
        console.log('[System] Starting Heartbeat Service...');
        setupHeartbeat();
    } catch (e) {
        console.error('[System] Heartbeat Service failed (non-fatal):', e);
    }

    console.log('[System] Connecting to Telegram...');
    await bot.start({
        onStart: async (botInfo: any) => {
            console.log(`[Bot] SUCCESS: Started as @${botInfo.username}`);

            // Send greeting to the allowed user to confirm bot is online
            try {
                await bot.api.sendMessage(
                    config.telegramAllowedUserId,
                    `🟢 **Gravity Claw is Online!**\n\nI am ready to receive your instructions.\n\nType /help for available commands.`,
                    { parse_mode: 'Markdown' }
                );
                console.log('[Bot] Startup greeting sent to user');
            } catch (e) {
                console.error('[Bot] Failed to send startup greeting:', e);
            }
        },
    });
}

// Graceful shutdown
const shutdown = async () => {
    console.log('\n[System] Gracefully shutting down...');
    await bot.stop();
    await closeMCPServers();
    db.close();
    console.log('[System] Shutdown complete. Goodbye.');
    process.exit(0);
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

main().catch(console.error);
