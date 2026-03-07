'use client';

import { useState, useEffect } from 'react';
import { Plug, X, CheckCircle, XCircle, MessageSquare, Database, Brain, Key, Loader2 } from 'lucide-react';

interface Connection {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'inactive';
    badge?: string;
}

const iconMap:Record<string,any>={telegram:MessageSquare,supabase:Database,gemini:Brain,openrouter:Brain,groq:Brain,brave:Database,cartesia:Key,clickup:Key,youtube:Plug};

export default function ConnectionsPage() {
    const [conns, setConns] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/connections');
            const data = await res.json();
            setConns(data.connections || []);
        } catch (error) {
            console.error('Failed to fetch connections:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const activeCount = conns.filter(c => c.status === 'active').length;
    const totalCount = conns.length;

    if (loading) {
        return (
            <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
        );
    }

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
                        style={{ width: totalCount > 0 ? `${(activeCount / totalCount) * 100}%` : '0%' }}
                    ></div>
                </div>
            </div>

            {/* Connection Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-md)' }}>
                {conns.map((conn, index) => {
                    const Icon = iconMap[conn.id] || Plug;
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

                                <span className={`badge ${isActive ? 'badge-success' : 'badge-error'}`}>
                                    {isActive ? (
                                        <><CheckCircle size={12} /> Active</>
                                    ) : (
                                        <><XCircle size={12} /> Inactive</>
                                    )}
                                </span>
                            </div>

                            {!isActive && (
                                <div style={{ marginTop: 'var(--space-md)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                    Configure in .env to enable
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
