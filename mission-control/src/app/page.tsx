'use client';

import { useState, useEffect } from 'react';
import {
    MessageSquare,
    Wrench,
    RefreshCw,
    Clock,
    Heart,
    Zap,
    FileText,
    Activity,
    Loader2
} from 'lucide-react';

interface ActivityItem {
    id: number;
    type: string;
    title: string;
    description: string;
    time: string;
    icon: string;
}

interface Stats {
    totalMessages: number;
    todayMessages: number;
    toolCalls: number;
    uptime: string;
}

interface Config {
    llm_provider: string;
    heartbeat_morning_cron?: string;
    heartbeat_afternoon_cron?: string;
    max_messages?: string;
}

export default function CommandCenter() {
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [stats, setStats] = useState<Stats>({ totalMessages: 0, todayMessages: 0, toolCalls: 0, uptime: '0h' });
    const [config, setConfig] = useState<Config>({ llm_provider: 'gemini' });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            // Fetch Activity & Stats
            const activityRes = await fetch('/api/activity?limit=10');
            const activityData = await activityRes.json();
            setActivity(activityData.messages || []);
            setStats(activityData.stats || { totalMessages: 0, todayMessages: 0, toolCalls: 0, uptime: '0h' });

            // Fetch Config
            const settingsRes = await fetch('/api/settings');
            const settingsData = await settingsRes.json();
            setConfig(settingsData.settings || { llm_provider: 'gemini' });
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'user': return MessageSquare;
            case 'bot': return FileText;
            default: return Activity;
        }
    };

    const getIconColor = (type: string) => {
        if (type.includes('received')) return 'var(--brand-blue)';
        if (type.includes('sent')) return 'var(--brand-green)';
        return 'var(--brand-orange)';
    };

    return (
        <div className="page">
            <div className="page-header fade-in">
                <h1 className="page-title">Command Center</h1>
                <p className="page-subtitle">Real-time overview of your AI agent</p>
            </div>

            {/* Stat Cards */}
            <div className="grid-4 fade-in fade-in-delay-1">
                <div className="stat-card">
                    <div className="stat-value">{stats.totalMessages}</div>
                    <div className="stat-label">Messages Handled</div>
                    <span className="stat-badge">+{stats.todayMessages} today</span>
                </div>
                <div className="stat-card blue">
                    <div className="stat-value">{stats.toolCalls}</div>
                    <div className="stat-label">Tool Calls</div>
                    <span className="stat-badge">Estimated</span>
                </div>
                <div className="stat-card green">
                    <div className="stat-value">0</div>
                    <div className="stat-label">Content Synced</div>
                    <span className="stat-badge">No platform</span>
                </div>
                <div className="stat-card red">
                    <div className="stat-value">{stats.uptime}</div>
                    <div className="stat-label">Agent Uptime</div>
                    <span className="stat-badge" style={{ backgroundColor: 'var(--brand-orange-dim)', color: 'var(--brand-orange)' }}>Active</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-lg)', marginTop: 'var(--space-xl)' }}>
                {/* Live Activity Feed */}
                <div className="card fade-in fade-in-delay-2">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Activity size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                            Live Activity
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="status-dot"></div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-time</span>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-xl)' }}>
                            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                        </div>
                    ) : activity.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {activity.map((item) => {
                                const Icon = getIcon(item.icon);
                                const color = getIconColor(item.type);

                                return (
                                    <ActivityItem
                                        key={item.id}
                                        icon={Icon}
                                        title={item.title}
                                        description={item.description}
                                        time={item.time}
                                        color={color}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p style={{ color: 'var(--text-muted)' }}>No activity yet. Start a conversation with your agent!</p>
                        </div>
                    )}
                </div>

                {/* Agent Configuration */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    <div className="card fade-in fade-in-delay-3">
                        <div className="card-header">
                            <h3 className="card-title">Agent Configuration</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <ConfigItem label="Model" value={config.llm_provider === 'gemini' ? 'gemini-2.0-flash' : config.llm_provider || 'Unknown'} />
                            <ConfigItem label="Provider" value={config.llm_provider || 'Not Set'} />
                            <ConfigItem label="Memory Stack" value="SQLite + Supabase" />
                            <ConfigItem label="Heartbeat" value={config.heartbeat_morning_cron ? 'Custom' : 'Every 5 minutes'} />
                            <ConfigItem label="Content Sync" value="Not configured" />
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card fade-in fade-in-delay-4">
                        <div className="card-header">
                            <h3 className="card-title">Quick Actions</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                <Heart size={16} />
                                Send Heartbeat
                            </button>
                            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                <RefreshCw size={16} />
                                Sync Content
                            </button>
                            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                <Zap size={16} />
                                Run Daily Brief
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ActivityItem({
    icon: Icon,
    title,
    description,
    time,
    color
}: {
    icon: any;
    title: string;
    description: string;
    time: string;
    color: string;
}) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-md)',
            padding: 'var(--space-sm)',
            borderRadius: 'var(--radius-md)',
            transition: 'background-color var(--transition-fast)',
        }}>
            <div style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: `${color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Icon size={16} color={color} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {description}
                </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-disabled)', whiteSpace: 'nowrap' }}>
                <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                {time}
            </div>
        </div>
    );
}

function ConfigItem({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
        </div>
    );
}
