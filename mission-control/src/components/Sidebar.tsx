'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Zap,
    CheckSquare,
    PlayCircle,
    Brain,
    Plug,
    Settings,
    Activity
} from 'lucide-react';

const navItems = [
    { href: '/', label: 'Command Center', icon: LayoutDashboard },
    { href: '/productivity', label: 'Productivity', icon: Zap },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/content', label: 'Content Intel', icon: PlayCircle },
    { href: '/brain', label: 'Second Brain', icon: Brain },
    { href: '/connections', label: 'Connections', icon: Plug },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside style={styles.sidebar}>
            {/* Logo & App Name */}
            <div style={styles.logoSection}>
                <div style={styles.logoContainer}>
                    <Activity size={24} color="var(--brand-orange)" />
                </div>
                <div>
                    <div style={styles.appName}>Gravity Claw</div>
                    <div style={styles.version}>v1.0.0</div>
                </div>
            </div>

            {/* Agent Status Card */}
            <div style={styles.statusCard}>
                <div style={styles.statusHeader}>
                    <div style={styles.statusDot}></div>
                    <span style={styles.statusText}>Agent Online</span>
                </div>
                <div style={styles.statusDetails}>
                    Railway · Gemini 3.1 Pro
                </div>
            </div>

            {/* Navigation */}
            <nav style={styles.nav}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                ...styles.navItem,
                                ...(isActive ? styles.navItemActive : {}),
                            }}
                        >
                            <Icon
                                size={18}
                                color={isActive ? 'var(--brand-orange)' : 'var(--text-secondary)'}
                            />
                            <span style={{
                                ...styles.navLabel,
                                ...(isActive ? styles.navLabelActive : {}),
                            }}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* XP Progress */}
            <div style={styles.xpSection}>
                <div style={styles.xpHeader}>
                    <span style={styles.xpLabel}>Level 7</span>
                    <span style={styles.xpTitle}>Field Agent</span>
                </div>
                <div style={styles.progressBar}>
                    <div style={styles.progressFill}></div>
                </div>
                <div style={styles.xpProgress}>3,240 / 5,000 XP</div>
            </div>
        </aside>
    );
}

const styles: Record<string, React.CSSProperties> = {
    sidebar: {
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--space-lg)',
        zIndex: 100,
    },
    logoSection: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        paddingBottom: 'var(--space-lg)',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: 'var(--space-lg)',
    },
    logoContainer: {
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--brand-orange-dim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    appName: {
        fontSize: '1.125rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
    },
    version: {
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
    },
    statusCard: {
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-md)',
        marginBottom: 'var(--space-lg)',
    },
    statusHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        marginBottom: 'var(--space-xs)',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: 'var(--brand-green)',
        animation: 'pulse 2s ease-in-out infinite',
    },
    statusText: {
        fontSize: '0.875rem',
        fontWeight: 500,
        color: 'var(--brand-green)',
    },
    statusDetails: {
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        paddingLeft: 16,
    },
    nav: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xs)',
    },
    navItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        padding: 'var(--space-sm) var(--space-md)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        transition: 'all var(--transition-fast)',
        opacity: 0.72,
    },
    navItemActive: {
        backgroundColor: 'var(--bg-elevated)',
        opacity: 1,
        borderLeft: '2px solid var(--brand-orange)',
    },
    navLabel: {
        fontSize: '0.875rem',
        fontWeight: 500,
    },
    navLabelActive: {
        color: 'var(--text-primary)',
    },
    xpSection: {
        paddingTop: 'var(--space-lg)',
        borderTop: '1px solid var(--border-subtle)',
    },
    xpHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-sm)',
    },
    xpLabel: {
        fontSize: '0.875rem',
        fontWeight: 600,
        color: 'var(--brand-orange)',
    },
    xpTitle: {
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
    },
    progressBar: {
        width: '100%',
        height: 6,
        backgroundColor: 'var(--bg-elevated)',
        borderRadius: 999,
        overflow: 'hidden',
    },
    progressFill: {
        width: '64.8%',
        height: '100%',
        background: 'linear-gradient(90deg, var(--brand-orange), var(--brand-blue))',
        borderRadius: 999,
    },
    xpProgress: {
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        marginTop: 'var(--space-xs)',
        textAlign: 'right',
    },
};
