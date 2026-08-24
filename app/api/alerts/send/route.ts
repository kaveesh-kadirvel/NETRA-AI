import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, name, level, pop, lat, lng } = body;

        const getUrgency = (lvl: string) => {
            if (lvl === 'CRITICAL' || lvl === 'HIGH') return 'URGENT: IMMEDIATE ACTION REQUIRED';
            return 'NOTICE: MONITORING ADVISED';
        };

        const emailText = `
===================================================
🚨 AUTOMATIC EMERGENCY ALERT DISPATCHED 
===================================================
TO:       regional.disaster.mgmt@gov.in
SUBJECT:  [${level} ALERT] Geospatial Anomaly in ${name}

DETAILS:
- Location:          ${name} (ID: ${id})
- Risk Level:        ${level}
- Coordinates:       ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}
- Est. Pop Exposed:  ${Number(pop || 0).toLocaleString()} people

SUMMARY:
${getUrgency(level)}. An automated geospatial pipeline 
has flagged this zone. Please review the live telemetry 
on the Netra Dashboard and align ground units if needed.
===================================================
`;

        // Output to the server console to demonstrate it actually fired
        console.log("\x1b[36m" + emailText.trim() + "\x1b[0m");

        // Fetch credentials from env
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        // Calculate Bounding Box around the coordinates for ArcGIS Export (approx 20km width)
        const centerLng = Number(lng);
        const centerLat = Number(lat);
        const bLng1 = centerLng - 0.15;
        const bLng2 = centerLng + 0.15;
        const bLat1 = centerLat - 0.075;
        const bLat2 = centerLat + 0.075;
        
        // Use Enterprise ESRI ArcGIS World Imagery mapping (highly reliable image proxy, no API key needed)
        const mapUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bLng1},${bLat1},${bLng2},${bLat2}&bboxSR=4326&size=600,300&imageSR=4326&format=png&f=image`;

        // Set to send to the provided email to ensure it's received
        const targetEmail = process.env.SMTP_USER;

        const mailOptions = {
            from: `"Netra Intelligence Command" <${process.env.SMTP_USER}>`,
            to: targetEmail, // Sending to yourself so you actually receive it!
            subject: `[${level} PRIORITY] Geospatial Intelligence Dispatch: ${name}`,
            text: emailText,
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; max-width: 650px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Top Secret Banner -->
                    <div style="text-align: center; font-size: 10px; font-weight: bold; color: #ef4444; letter-spacing: 2px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                        RESTRICTED DISPATCH // FOR OFFICIAL USE ONLY // TLP:AMBER
                    </div>

                    <!-- Header -->
                    <div style="background: ${level === 'CRITICAL' ? '#991b1b' : level === 'HIGH' ? '#c2410c' : '#0f766e'}; padding: 20px; border-radius: 8px 8px 0 0; color: white;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td>
                                    <h2 style="margin: 0; font-size: 20px; text-transform: uppercase;">🚨 AUTOMATIC EMERGENCY DISPATCH</h2>
                                    <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.85; font-family: monospace;">NETRA.AI // PIPELINE_ID: ${id.substring(0, 8).toUpperCase()}</p>
                                </td>
                                <td align="right" style="vertical-align: top;">
                                    <div style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                                        STATUS: ACTIVE
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- Body -->
                    <div style="background: white; padding: 28px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
                        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px;">Incident Target: <span style="color: ${level === 'CRITICAL' ? '#dc2626' : '#2563eb'}">${name}</span></h3>
                        
                        <!-- Satellite Image -->
                        <div style="margin-bottom: 24px; border-radius: 8px; border: 1px solid #cbd5e1; background: #0f172a;">
                            <img src="${mapUrl}" alt="Satellite Map of ${name}" width="600" height="300" style="display: block; width: 100%; max-width: 100%; height: auto; border-radius: 8px 8px 0 0;" />
                            <div style="padding: 8px; text-align: center; color: #94a3b8; font-size: 11px; text-transform: uppercase; font-family: monospace; letter-spacing: 1px;">
                                📡 \u00A0 ESRI LIVE SATELLITE FEED \u00A0 · \u00A0 \u00A0 ${Number(lat).toFixed(4)}°N, ${Number(lng).toFixed(4)}°E \u00A0 · \u00A0 TARGET CENTERED
                            </div>
                        </div>

                        <!-- Data Table -->
                        <table style="width: 100%; margin-bottom: 24px; text-align: left; border-collapse: collapse; font-size: 14px;">
                            <tr><th style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #475569; width: 140px;">Dispatched At</th><td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; color: #0f172a;">${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC</td></tr>
                            <tr><th style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #475569;">Risk Level</th><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: ${level === 'CRITICAL' ? '#dc2626' : '#0f172a'};">${level}</td></tr>
                            <tr><th style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #475569;">Population Exp.</th><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">~${Number(pop || 0).toLocaleString()} personnel</td></tr>
                            <tr><th style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #475569;">Event Hash</th><td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; color: #64748b; font-size: 12px;">${id}</td></tr>
                        </table>

                        <!-- Summary & Directive -->
                        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 0 4px 4px 0;">
                            <p style="color: #92400e; font-weight: bold; margin: 0 0 8px 0; text-transform: uppercase;">${getUrgency(level)}</p>
                            <p style="color: #92400e; line-height: 1.5; margin: 0; font-size: 14px;">An automated geospatial SAR/Multispectral pipeline has flagged this zone with high confidence. Immediate assessment requires alignment of regional ground units. Please review live telemetry immediately.</p>
                        </div>

                        <!-- Action Buttons -->
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="http://localhost:3000/dashboard" style="background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px; font-size: 14px;">View Live Dashboard</a>
                            <a href="#" style="background: white; color: #0f172a; border: 1px solid #cbd5e1; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">Acknowledge Dispatch</a>
                        </div>
                    </div>

                    <!-- Footer Warning -->
                    <div style="text-align: center; margin-top: 24px; font-size: 10px; color: #94a3b8; line-height: 1.6;">
                        <p style="margin: 0;"><strong>CONFIDENTIALITY NOTICE:</strong> This electronic dispatch contains privileged geospatial intelligence intended solely for the use of emergency management directors and authorized personnel. If you are not the intended recipient, any disclosure, copying, or distribution is strictly prohibited.</p>
                        <p style="margin: 8px 0 0 0; text-transform: uppercase;">Generated securely by Netra AI Command Engine</p>
                    </div>
                </div>
            `,
        };

        const result = await transporter.sendMail(mailOptions);
        console.log("📬 Email successfully dispatched! MessageID: %s", result.messageId);

        return NextResponse.json({ success: true, message: 'Alert dispatched to emergency contacts.' });
    } catch (error: any) {
        console.error("Alert Dispatch Error:", error);
        return NextResponse.json({ error: error.message || "Failed to send alert" }, { status: 500 });
    }
}
