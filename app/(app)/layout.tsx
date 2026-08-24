import type { Metadata } from 'next';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from '@/context/LanguageContext';

export const metadata: Metadata = {
    title: 'NETRA.AI — Dashboard',
    description: 'Real-time satellite climate risk dashboard',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <div className="flex h-screen overflow-hidden font-sans bg-slate-50 text-slate-900 antialiased">
                <Sidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                    <Navbar />
                    <main className="flex-1 overflow-y-auto bg-slate-50 relative" style={{ padding: '32px 36px' }}>
                        {children}
                    </main>
                    <Toaster position="top-right" />
                </div>
            </div>
        </LanguageProvider>
    );
}
