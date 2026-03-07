import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
    title: 'Mission Control | Gravity Claw',
    description: 'Premium dark-mode dashboard for your AI agent',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <Sidebar />
                <main style={{
                    marginLeft: 'var(--sidebar-width)',
                    minHeight: '100vh',
                    backgroundColor: 'var(--bg-page)',
                }}>
                    {children}
                </main>
            </body>
        </html>
    );
}
