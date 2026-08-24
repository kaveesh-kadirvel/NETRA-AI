import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { text, target } = await req.json();
        const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
        }

        const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                target: target,
            }),
        });

        const data = await response.json();

        if (data.error) {
            console.error('Google Translate Error:', data.error);
            return NextResponse.json({ error: data.error.message }, { status: 400 });
        }

        const translated = data.data.translations.map((t: any) => t.translatedText);
        return NextResponse.json({
            translatedText: Array.isArray(text) ? translated : translated[0]
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
