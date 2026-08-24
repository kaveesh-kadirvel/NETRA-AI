import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { validatePrescription } from '@/lib/agronomy/guardrails';

/**
 * POST /api/dispatch/mission
 *
 * Accepts a farm action (fertilizer / irrigation / drone-survey) and:
 *   1. Sends a real email alert to the demo recipient
 *   2. Returns a mission ID + ETA
 *
 * For judges: this proves the system can trigger REAL-WORLD actions
 * from satellite data — not just visualizations.
 */

const MISSION_COUNTER = { value: 1000 };

function getMissionId(): string {
    MISSION_COUNTER.value += 1;
    return `KS-${Date.now().toString(36).toUpperCase()}-${MISSION_COUNTER.value}`;
}

const ACTION_META: Record<string, { emoji: string; label: string; unit: string; urgency: string }> = {
    fertilizer: { emoji: '🌱', label: 'Fertilizer Application',  unit: 'kg/ha Urea',  urgency: 'Within 48 hours' },
    irrigation:  { emoji: '💧', label: 'Irrigation Dispatch',    unit: 'mm water',     urgency: 'Within 24 hours' },
    drone:       { emoji: '🚁', label: 'Drone Survey Mission',   unit: 'ha coverage',  urgency: 'Today' },
    alert:       { emoji: '⚠️', label: 'Critical Field Alert',   unit: 'fields',       urgency: 'Immediate' },
};

async function sendMissionEmail(payload: any, missionId: string) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    // Support both SMTP_PASSWORD and SMTP_PASS for flexibility
    const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
    // Default "to" = same as sender so they receive it in their own inbox
    const to   = process.env.ALERT_EMAIL || user || 'netra.ai.demo@gmail.com';

    let transporter: ReturnType<typeof nodemailer.createTransport>;

    if (host && user && pass) {
        // Use explicit SMTP config (works reliably with Gmail App Passwords)
        transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,      // true for 465, STARTTLS for 587
            auth: { user, pass },
            tls: { rejectUnauthorized: false }, // avoids cert issues on some hosts
        });
        console.log(`[Dispatch] Using SMTP: ${host}:${port} as ${user} → ${to}`);
    } else {
        // Fallback: Ethereal test account (no creds needed, shows preview URL)
        console.warn('[Dispatch] No SMTP creds found — using Ethereal test account');
        const acc = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email', port: 587, secure: false,
            auth: { user: acc.user, pass: acc.pass },
        });
    }

    const meta = ACTION_META[payload.actionType] ?? ACTION_META.alert;
    const now  = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // ── Resolve display values — never show "—" for critical fields ──────
    const farmName    = payload.farmName  || 'Your Field';
    const farmArea    = payload.area      || 'Not specified';
    // healthScore can be 0 which is falsy — check explicitly for undefined/null
    const healthNum   = (payload.healthScore != null && payload.healthScore !== '') ? Number(payload.healthScore) : null;
    const healthLabel = healthNum !== null ? `${healthNum}/100` : 'Not measured';
    const healthColor = healthNum === null ? '#64748B' : healthNum >= 70 ? '#16A34A' : healthNum >= 40 ? '#D97706' : '#DC2626';
    const healthWord  = healthNum === null ? 'Unknown' : healthNum >= 70 ? 'Good 🟢' : healthNum >= 40 ? 'Fair 🟡' : 'Poor 🔴';
    // quantity — show as-is (already contains unit), don't double-append meta.unit
    const dose = payload.quantity || meta.urgency;
    const riskBg    = payload.riskLevel === 'CRITICAL' ? '#FEE2E2' : payload.riskLevel === 'HIGH' ? '#FEF3C7' : '#F0FDF4';
    const riskColor = payload.riskLevel === 'CRITICAL' ? '#DC2626' : payload.riskLevel === 'HIGH' ? '#D97706' : '#16A34A';

    // Action-specific translations
    const actionInHindi: Record<string, string> = {
        fertilizer: 'Apne khet mein khad daalein',
        irrigation:  'Apne khet mein paani dein',
        drone:       'Drone survey shuru ho gayi hai',
        alert:       'Aapke khet mein aapaat sthiti hai',
    };
    const actionHindi = actionInHindi[payload.actionType] ?? 'Apne khet par dhyan dein';

    const html = `
<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NETRA.AI — Kisan Saathi Alert</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- ══ HEADER ══════════════════════════════════════════════════ -->
  <tr><td style="background:linear-gradient(135deg,#0A1628 0%,#0D7377 100%);border-radius:16px 16px 0 0;padding:32px 32px 24px;text-align:center;">
    <div style="font-size:36px;margin-bottom:8px;">${meta.emoji}</div>
    <h1 style="color:white;font-size:24px;margin:0 0 6px;font-weight:900;letter-spacing:-0.02em;">NETRA.AI — Kisan Saathi</h1>
    <p style="color:rgba(255,255,255,0.65);font-size:13px;margin:0;">Satellite se Seedha Aapke Khet Ki Khabar</p>
    <div style="display:inline-block;background:rgba(34,197,94,0.25);border:1.5px solid rgba(34,197,94,0.5);color:#4ADE80;border-radius:20px;padding:5px 16px;font-size:11px;font-weight:800;letter-spacing:0.1em;margin-top:14px;">✓ MISSION DISPATCHED</div>
  </td></tr>

  <!-- ══ HINDI HEADLINE ══════════════════════════════════════════ -->
  <tr><td style="background:#0D7377;padding:14px 32px;text-align:center;">
    <p style="color:white;font-size:15px;font-weight:700;margin:0;">🌾 ${actionHindi}</p>
  </td></tr>

  <!-- ══ BODY ════════════════════════════════════════════════════ -->
  <tr><td style="background:white;padding:28px 32px;">

    <!-- Mission ID -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:2px dashed #0D7377;border-radius:12px;padding:16px;margin-bottom:24px;">
    <tr>
      <td style="text-align:center;">
        <p style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;margin:0 0 6px;">Mission Number (Save this!)</p>
        <p style="font-family:monospace;font-size:26px;font-weight:900;color:#0D7377;letter-spacing:0.06em;margin:0;">${missionId}</p>
        <p style="font-size:11px;color:#94A3B8;margin:6px 0 0;">Sent at ${now} IST</p>
      </td>
    </tr>
    </table>

    <!-- What happened -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0D7377,#10B981);border-radius:12px;padding:20px;margin-bottom:24px;">
    <tr>
      <td>
        <p style="color:rgba(255,255,255,0.75);font-size:10px;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin:0 0 6px;">What Happened?</p>
        <h2 style="color:white;font-size:17px;font-weight:900;margin:0 0 8px;">${meta.emoji} ${meta.label} Required</h2>
        <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:0;line-height:1.7;">
          NETRA.AI ne satellite dwara aapke khet mein <strong>${meta.label.toLowerCase()}</strong> ki zaroorat detect ki hai.
          Neeche diye gaye details ko padhein aur action lein.
        </p>
      </td>
    </tr>
    </table>

    <!-- Farm Details Grid -->
    <p style="font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px;">📋 Khet Ki Jaankari (Farm Details)</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">

      <!-- Row 1 -->
      <tr>
        <td width="48%" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;vertical-align:top;">
          <p style="font-size:10px;color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px;">🏡 Farm Name</p>
          <p style="font-size:18px;font-weight:900;color:#0F172A;margin:0;">${farmName}</p>
        </td>
        <td width="4%"></td>
        <td width="48%" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;vertical-align:top;">
          <p style="font-size:10px;color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px;">📐 Farm Area (Khet ka Kshetrafal)</p>
          <p style="font-size:18px;font-weight:900;color:#0F172A;margin:0;">${farmArea}</p>
        </td>
      </tr>

      <tr><td colspan="3" style="height:10px;"></td></tr>

      <!-- Row 2 -->
      <tr>
        <td width="48%" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;vertical-align:top;">
          <p style="font-size:10px;color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px;">💚 Crop Health (Fasal Ki Sehat)</p>
          <p style="font-size:18px;font-weight:900;color:${healthColor};margin:0;">${healthLabel}</p>
          <p style="font-size:11px;color:${healthColor};margin:4px 0 0;font-weight:600;">${healthWord}</p>
        </td>
        <td width="4%"></td>
        <td width="48%" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;vertical-align:top;">
          <p style="font-size:10px;color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px;">💊 Recommended Dose (Dawai / Khad)</p>
          <p style="font-size:16px;font-weight:900;color:#0F172A;margin:0;">${dose}</p>
        </td>
      </tr>
    </table>

    <!-- Risk level banner -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${riskBg};border:1.5px solid ${riskColor}40;border-radius:10px;padding:14px 16px;margin-bottom:24px;">
    <tr>
      <td>
        <p style="font-size:13px;font-weight:800;color:${riskColor};margin:0;">
          ⚠️ Crop Risk Level: <strong>${payload.riskLevel || 'MEDIUM'}</strong>
          &nbsp;·&nbsp; ⏰ ${meta.urgency}
        </p>
        <p style="font-size:11px;color:${riskColor};margin:5px 0 0;opacity:0.8;">
          Satellite pass se pehle action lein warna fasal ki paidawar ghatt sakti hai.
        </p>
      </td>
    </tr>
    </table>

    <!-- Steps to Act -->
    <p style="font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px;">✅ Aapko Kya Karna Hai? (What To Do)</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${payload.actionType === 'fertilizer' ? `
      <tr><td style="border-left:3px solid #16A34A;padding:10px 14px;background:#F0FDF4;border-radius:0 8px 8px 0;margin-bottom:6px;">
        <p style="font-size:13px;font-weight:800;color:#15803D;margin:0;">Step 1: Khad Khareedein</p>
        <p style="font-size:12px;color:#166534;margin:4px 0 0;">${dose} — Neem Coated Urea ya DAP lete hain</p>
      </td></tr>
      <tr><td style="height:6px;"></td></tr>
      <tr><td style="border-left:3px solid #0D7377;padding:10px 14px;background:#F0FDFA;border-radius:0 8px 8px 0;">
        <p style="font-size:13px;font-weight:800;color:#0D7377;margin:0;">Step 2: Khet Mein Daalein</p>
        <p style="font-size:12px;color:#115E59;margin:4px 0 0;">Shaam ko ya subah swaich mein daalein. Pani ke baad daalein zyada acha hoga.</p>
      </td></tr>
      ` : `
      <tr><td style="border-left:3px solid #1D4ED8;padding:10px 14px;background:#EFF6FF;border-radius:0 8px 8px 0;margin-bottom:6px;">
        <p style="font-size:13px;font-weight:800;color:#1E40AF;margin:0;">Step 1: Irrigation Shuru Karen</p>
        <p style="font-size:12px;color:#1E40AF;margin:4px 0 0;">${dose} — Drip ya sprinkler se dete hain</p>
      </td></tr>
      <tr><td style="height:6px;"></td></tr>
      <tr><td style="border-left:3px solid #0D7377;padding:10px 14px;background:#F0FDFA;border-radius:0 8px 8px 0;">
        <p style="font-size:13px;font-weight:800;color:#0D7377;margin:0;">Step 2: 24 Ghante Ke Andar</p>
        <p style="font-size:12px;color:#115E59;margin:4px 0 0;">Agli satellite scan ke baad update aayegi. App kholen aur dekhen.</p>
      </td></tr>
      `}
    </table>

    <!-- Satellite details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px 16px;margin-bottom:8px;">
    <tr>
      <td>
        <p style="font-size:10px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">🛰 Satellite Data Details</p>
        <p style="font-size:11px;color:#64748B;line-height:1.9;margin:0;">
          <strong>Source:</strong> Sentinel-1 SAR + Sentinel-2 NDVI (Google Earth Engine)<br>
          <strong>Coordinates:</strong> Lat ${payload.lat?.toFixed(4) ?? 'N/A'}, Lon ${payload.lng?.toFixed(4) ?? 'N/A'}<br>
          <strong>Analysis Time:</strong> ${now} IST<br>
          <strong>Mission ID:</strong> ${missionId}
        </p>
      </td>
    </tr>
    </table>

  </td></tr>

  <!-- ══ FOOTER ══════════════════════════════════════════════════ -->
  <tr><td style="background:#0A1628;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
    <p style="color:rgba(255,255,255,0.6);font-size:12px;font-weight:700;margin:0 0 4px;">NETRA.AI · Kisan Saathi</p>
    <p style="color:rgba(255,255,255,0.35);font-size:10px;margin:0;">Powered by Google Earth Engine · Sentinel Satellites</p>
    <p style="color:rgba(255,255,255,0.25);font-size:10px;margin:6px 0 0;">HackX 4.0 · Precision AgriTech India · © 2026</p>
  </td></tr>

</table>
</td></tr>
</table>

</body>
</html>`;

    const info = await transporter.sendMail({
        from:    `"NETRA.AI Kisan Saathi 🌾" <${user || 'noreply@netra.ai'}>`,
        to,
        subject: `${meta.emoji} ${farmName} — ${meta.label} Needed! Mission ${missionId}`,
        html,
    });

    return { messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) || null };
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            farmId, farmName, actionType = 'fertilizer',
            healthScore, area, quantity, riskLevel, lat, lng,
        } = body;

        if (!farmName && !farmId) {
            return NextResponse.json({ error: 'farmName is required' }, { status: 400 });
        }

        // ── AI SAFETY GUARDRAILS ─────────────────────────────────────────────
        // Parse dose from quantity string (e.g. "80 kg/ha Urea" → 80)
        const doseMatch  = typeof quantity === 'string' ? quantity.match(/(\d+(?:\.\d+)?)/) : null;
        const doseNum    = doseMatch ? parseFloat(doseMatch[1]) : undefined;
        const guardInput = actionType === 'fertilizer'
            ? { ureaNKgHa: doseNum }
            : actionType === 'irrigation'
            ? { waterMm: doseNum }
            : {};

        const guardResult = validatePrescription({ ...guardInput, confidence: healthScore ? healthScore / 100 : 0.85 });
        if (!guardResult.safe) {
            console.warn('[Guardrail] Warnings:', guardResult.warnings);
        }
        // Hard block: if dose was clamped by guardrails, update what we show the farmer
        const safeQuantity = guardResult.clamped.ureaNKgHa !== doseNum && doseNum !== undefined
            ? (quantity as string).replace(String(doseNum), String(guardResult.clamped.ureaNKgHa ?? doseNum))
            : quantity;

        const missionId = getMissionId();
        const eta       = actionType === 'drone' ? '2h 30m' : actionType === 'irrigation' ? '45m' : '4h 00m';

        // ── FIRE EMAIL ────────────────────────────────────────────────────────
        let emailResult: any = { sent: false };
        try {
            emailResult = await sendMissionEmail(
                { farmId, farmName, actionType, healthScore, area, quantity: safeQuantity, riskLevel, lat, lng },
                missionId
            );
            emailResult.sent = true;
        } catch (emailErr) {
            console.warn('[Dispatch] Email failed (demo mode):', emailErr);
        }

        // ── FIRE TELEGRAM ALERT (non-blocking, best-effort) ───────────────────
        try {
            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            fetch(`${baseUrl}/api/telegram/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    farmId, farmName, cropType: body.cropType,
                    healthScore, actionType,
                    quantity: safeQuantity, riskLevel, area, missionId,
                }),
            }).catch(() => {}); // fire-and-forget — never blocks the response
        } catch {}

        return NextResponse.json({
            success:     true,
            missionId,
            eta,
            actionType,
            farmName:    farmName || 'Field',
            quantity:    safeQuantity,
            riskLevel,
            email:       emailResult,
            guardrails:  { safe: guardResult.safe, warnings: guardResult.warnings },
            dispatchedAt: new Date().toISOString(),
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}


