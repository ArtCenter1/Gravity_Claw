// Test script to verify Telegram bot communication
import 'dotenv/config';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const USER_ID = process.env.TELEGRAM_ALLOWED_USER_ID;

async function testBot() {
    console.log('Testing Telegram Bot Communication...\n');

    // Test 1: Get bot info
    console.log('1. Getting bot info...');
    try {
        const botInfoResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
        const botInfo = await botInfoResponse.json();
        if (botInfo.ok) {
            console.log(`   ✅ Bot @${botInfo.result.username} is running`);
        } else {
            console.log('   ❌ Failed to get bot info:', botInfo);
        }
    } catch (e) {
        console.log('   ❌ Error:', e.message);
    }

    // Test 2: Send a test message to the user
    console.log('\n2. Sending test message to user...');
    try {
        const sendMessageResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: USER_ID,
                text: '🧪 **Test Message**\n\nThis is a test to verify the Telegram bot is communicating properly.',
                parse_mode: 'Markdown'
            })
        });
        const sendMessageResult = await sendMessageResponse.json();
        if (sendMessageResult.ok) {
            console.log('   ✅ Test message sent successfully!');
            console.log(`   Message ID: ${sendMessageResult.result.message_id}`);
        } else {
            console.log('   ❌ Failed to send message:', sendMessageResult);
        }
    } catch (e) {
        console.log('   ❌ Error:', e.message);
    }

    // Test 3: Check if bot can receive messages (webhook info)
    console.log('\n3. Checking webhook status...');
    try {
        const webhookInfoResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
        const webhookInfo = await webhookInfoResponse.json();
        if (webhookInfo.ok) {
            console.log(`   Webhook URL: ${webhookInfo.result.url || '(none - using polling)'}`);
            console.log(`   Pending updates: ${webhookInfo.result.pending_update_count}`);
        }
    } catch (e) {
        console.log('   ❌ Error:', e.message);
    }

    console.log('\n--- Test Complete ---');
}

testBot();
