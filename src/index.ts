import { bot } from './bot.js';
import { db } from './db/sqlite.js';
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
    await initializeMCPServers();

    // Start Heartbeat Service (Cron Jobs)
    setupHeartbeat();

    await bot.start({
        onStart: (botInfo: any) => {
            console.log(`[Bot] Started as @${botInfo.username}`);
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
