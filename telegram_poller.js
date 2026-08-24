const https = require('https');
const http = require('http');
require('dotenv').config({ path: '.env.local' });

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error("No TELEGRAM_BOT_TOKEN found in .env.local");
    process.exit(1);
}

let offset = 0;

console.log("==========================================");
console.log("🛰  NETRA Telegram Local Poller Started  🛰");
console.log("==========================================");
console.log("This script bypasses the need for Ngrok by long-polling Telegram's servers");
console.log("and pushing the events exactly to your local webhook.");

function poll() {
    https.get(`https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=10`, (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (data.ok && data.result.length > 0) {
                    data.result.forEach(update => {
                        offset = update.update_id + 1; // Mark as read
                        
                        // Fake a webhook request to localhost
                        const reqData = JSON.stringify(update);
                        const forwardReq = http.request({
                            hostname: 'localhost',
                            port: 3000,
                            path: '/api/telegram/webhook',
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(reqData) }
                        }, (fwRes) => {
                            let fBody = '';
                            fwRes.on('data', d => fBody += d);
                            fwRes.on('end', () => {
                                console.log(`[Poller] Forwarded Update ${update.update_id} -> HTTP ${fwRes.statusCode}`);
                            });
                        });
                        
                        forwardReq.on('error', (e) => console.error("[Poller Error forwarding to localhost]", e.message));
                        forwardReq.write(reqData);
                        forwardReq.end();
                    });
                }
            } catch (err) {
                console.error("[Poller Parse Error]", err.message);
            }
            // Loop quickly
            setTimeout(poll, 1000);
        });
    }).on('error', (e) => {
        console.error("Polling Network Error:", e.message);
        setTimeout(poll, 5000); // Wait longer on failure
    });
}

// Ensure the bot deletes webhook config first so getUpdates can work!
https.get(`https://api.telegram.org/bot${token}/deleteWebhook`, () => {
    console.log("[Poller] Cleared existing webhook constraints. Polling started...");
    poll();
});
