'use client';

import { useState } from 'react';
import { Plug, X, CheckCircle, XCircle, MessageSquare, Database, Brain, Key } from 'lucide-react';

interface Connection {
    id: string;
    name: string;
    description: string;
    icon: any;
    status: 'active' | 'inactive';
    badge?: string;
}

const connections: Connection[] = [
    {
        id: 'telegram',
        name: 'Telegram',
        description: 'Primary communication channel',
        icon: MessageSquare,
        status: 'active'
    },
    {
        id: 'supabase',
        name: 'Supabase',
        description: 'Semantic memory & real-time data',
        icon: Database,
        status: 'active'
    },
    {
        id: 'gemini',
        name: 'Google Gemini',
        description: 'LLM provider for AI responses',
        icon: Brain,
        status: 'active'
    },
    {
        id: 'openrouter',
        name: 'OpenRouter',
        description: 'Alternative LLM provider',
        icon: Brain,
        status: 'inactive'
    },
    {
        id: 'clickup',
        name: 'ClickUp',
        description: 'Task management integration',
        icon: Key,
        status: 'inactive'
    },
    {
        id: 'youtube',
        name: 'YouTube',
        description: 'Content platform sync',
        icon: Plug,
        status: 'inactive',
        badge: 'via Zapier'
    },
];

export default function ConnectionsPage() {
    const [conns, setConns] = useState(connections);
    const activeCount = conns.filter(c => c.status === 'active').length;
    const totalCount = conns.length;

    const toggleConnection = (id: string) => {
        setConns(prev => prev.map(c =>
            c.id === id
                ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' }
                : c
        ));
    };

    return (
        <div className="page">
            <div className="page-header fade-in">
                <h1 className="page-title">Connections</h1>
                <p className="page-subtitle">Manage your agent's integrations and services</p>
            </div>

            {/* Progress Bar */}
            <div className="card fade-in fade-in-delay-1" style={{ marginBottom: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Connections Active</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{activeCount} / {totalCount}</span>
                </div>
                <div className="progress-bar" style={{ height: 10 }}>
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${(activeCount / totalCount) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Connection Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-md)' }}>
                {conns.map((conn, index) => {
                    const Icon = conn.icon;
                    const isActive = conn.status === 'active';

                    return (
                        <div
                            key={conn.id}
                            className={`card fade-in`}
                            style={{
                                borderStyle: isActive ? 'solid' : 'dashed',
                                opacity: isActive ? 1 : 0.7,
                                animationDelay: `${(index + 2) * 50}ms`,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                                    <div style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: isActive ? 'var(--brand-green-dim)' : 'var(--bg-elevated)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Icon size={24} color={isActive ? 'var(--brand-green)' : 'var(--text-muted)'} />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{conn.name}</span>
                                            {conn.badge && (
                                                <span style={{
                                                    fontSize: '0.625rem',
                                                    backgroundColor: 'var(--brand-blue-dim)',
                                                    color: 'var(--brand-blue)',
                                                    padding: '2px 6px',
                                                    borderRadius: 4,
                                                }}>
                                                    {conn.badge}
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{conn.description}</span>
                                    </div>
                                </div>

                                {isActive ? (
                                    <button
                                        onClick={() => toggleConnection(conn.id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: 4,
                                            borderRadius: 'var(--radius-sm)',
                                            color: 'var(--text-muted)',
                                            transition: 'all var(--transition-fast)',
                                        }}
                                        title="Disconnect"
                                    >
                                        <X size={18} />
                                    </button>
                                ) : (
                                    <span className={`badge ${isActive ? 'badge-success' : 'badge-error'}`}>
                                        {isActive ? (
                                            <><CheckCircle size={12} /> Active</>
                                        ) : (
                                            <><XCircle size={12} /> Inactive</>
                                        )}
                                    </span>
                                )}
                            </div>

                            {!isActive && (
                                <button
                                    className="btn btn-secondary"
                                    style={{ width: '100%', marginTop: 'var(--space-md)' }}
                                    onClick={() => toggleConnection(conn.id)}
                                >
                                    <Plug size={16} />
                                    Connect
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
