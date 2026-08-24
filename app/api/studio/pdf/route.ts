import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const pythonExecutable = 'python';
        const scriptPath = path.join(process.cwd(), 'cosmeon', 'pdf_gen.py');

        return new Promise<NextResponse>((resolve) => {
            const pythonProcess = spawn(pythonExecutable, [scriptPath]);
            let dataString = '';
            let errorString = '';

            pythonProcess.stdout.on('data', (data) => {
                dataString += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorString += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error("PDF Gen Error:", errorString);
                    resolve(NextResponse.json({ success: false, error: 'PDF generation failed' }, { status: 500 }));
                    return;
                }

                try {
                    const pdfPath = dataString.trim();
                    if (!fs.existsSync(pdfPath)) {
                        throw new Error("PDF file not found at " + pdfPath);
                    }

                    const pdfBuffer = fs.readFileSync(pdfPath);

                    // Cleanup
                    fs.unlinkSync(pdfPath);

                    return resolve(new NextResponse(pdfBuffer, {
                        headers: {
                            'Content-Type': 'application/pdf',
                            'Content-Disposition': 'attachment; filename="Cosmeon_Report.pdf"',
                        },
                    }));
                } catch (e) {
                    console.error("Failed to read PDF output:", e);
                    resolve(NextResponse.json({ success: false, error: 'Failed to retrieve generated PDF' }, { status: 500 }));
                }
            });

            pythonProcess.stdin.write(JSON.stringify(body));
            pythonProcess.stdin.end();
        });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
