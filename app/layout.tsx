import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: 'NETRA.AI — Climate Risk Intelligence Engine',
    description: 'Satellite-derived flood intelligence for district-level climate risk assessment powered by AI and Google Earth Engine.',
    keywords: ['flood detection', 'climate risk', 'satellite imagery', 'India', 'Assam', 'disaster management', 'NETRA.AI'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={inter.variable} style={{ margin: 0, padding: 0, width: '100%', height: '100%' }}>
            <body style={{ margin: 0, padding: 0, overflowX: 'hidden', minHeight: '100vh' }}>
                {children}
            </body>
        </html>
    );
}
