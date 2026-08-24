import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/telegram/send
 * Sends a farm alert to a Telegram chat with an inline "Mark Fertilized" button.
 * When the farmer taps the button on their phone:
 *   → Telegram calls our webhook (/api/telegram/webhook)
 *   → Webhook PATCHes the farm status to GOOD
 *   → Map marker changes from red to green in real time
 *
 * Required env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 */

const BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID    = process.env.TELEGRAM_CHAT_ID;

const RISK_EMOJI: Record<string, string> = {
    CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🟢', HEALTHY: '🟢',
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            farmId, farmName, cropType, healthScore,
            actionType, quantity, riskLevel, area,
            missionId,
        } = body;

        // Graceful degradation: if no Telegram token configured, return mock success
        if (!BOT_TOKEN || !CHAT_ID) {
            console.warn('[Telegram] No BOT_TOKEN/CHAT_ID set — skipping real send (demo mode)');
            return NextResponse.json({
                ok: true,
                demo: true,
                message: 'Telegram not configured — set TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID in .env.local',
            });
        }

        const riskEmoji = RISK_EMOJI[riskLevel] ?? '⚪';
        const actionEmoji = actionType === 'fertilizer' ? '🌱' : actionType === 'irrigation' ? '💧' : '⚠️';
        const actionLabel = actionType === 'fertilizer' ? 'Khad (Fertilizer)' : actionType === 'irrigation' ? 'Paani (Irrigation)' : 'Action';
        const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        const text = [
            `${actionEmoji} *NETRA.AI — Fasal Seva Alert*`,
            '',
            `Farm: *${farmName}* ${riskEmoji}`,
            `Fasal: ${cropType ?? '—'} | Area: ${area ?? '—'}`,
            `Crop Health: *${healthScore ?? '—'}/100* (${riskLevel})`,
            '',
            `Action Required: *${actionLabel}*`,
            `Recommended Dose: *${quantity ?? '—'}*`,
            `Mission ID: \`${missionId}\``,
            '',
            `_${now} IST — Satellite Data: Sentinel-2_`,
        ].join('\n');

        const payload = {
            chat_id: CHAT_ID,
            text,
            // Use compact callback_data (Telegram limit: 64 bytes)
            // Format: "action:farmId:missionId" — parsed in webhook
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: '✅ Mark Fertilized — Done!',
                        callback_data: `done:${(farmId ?? 'na').toString().slice(-12)}:${missionId.slice(-8)}`,
                    },
                    {
                        text: '🗺️ View on Map',
                        url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/map`,
                    },
                ]],
            },
        };

        const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const tgJson = await tgRes.json();
        if (!tgJson.ok) {
            return NextResponse.json({ ok: false, error: tgJson.description }, { status: 400 });
        }

        return NextResponse.json({ ok: true, messageId: tgJson.result?.message_id });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
}
