'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Circle, CheckCircle, Bot, User, Clock, ArrowRight, Loader2, MessageSquare } from 'lucide-react';

interface Task {
    id: number;
    role: string;
    content: string;
    timestamp: string;
}

export default function TasksPage() {
    const [activeTab, setActiveTab] = useState<'human' | 'agent'>('human');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMessages() {
            try {
                const res = await fetch('/api/activity?limit=30');
                const data = await res.json();
                // Use messages as tasks
                setTasks(data.messages || []);
            } catch (error) {
                console.error('Failed to fetch tasks:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchMessages();
    }, []);

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        const date = new Date(timeStr);
        if (isNaN(date.getTime())) return timeStr; // Fallback to raw string if not parseable

        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return 'just now';
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="page">
            <div className="page-header fade-in">
                <h1 className="page-title">Tasks & Projects</h1>
                <p className="page-subtitle">View messages and agent activity</p>
            </div>

            {/* Tabs */}
            <div className="tabs fade-in fade-in-delay-1" style={{ marginBottom: 'var(--space-xl)', maxWidth: 400 }}>
                <button
                    className={`tab ${activeTab === 'human' ? 'active' : ''}`}
                    onClick={() => setActiveTab('human')}
                >
                    <User size={16} style={{ marginRight: 8 }} />
                    Messages
                </button>
                <button
                    className={`tab ${activeTab === 'agent' ? 'active' : ''}`}
                    onClick={() => setActiveTab('agent')}
                >
                    <Bot size={16} style={{ marginRight: 8 }} />
                    Agent Actions
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-xl)' }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                </div>
            ) : activeTab === 'human' ? (
                /* Messages List */
                <div className="card fade-in fade-in-delay-2">
                    <div className="card-header">
                        <h3 className="card-title">
                            <MessageSquare size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                            Message History
                        </h3>
                        <span className="badge badge-info">{tasks.length} messages</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                style={{
                                    padding: 'var(--space-md)',
                                    backgroundColor: 'var(--bg-input)',
                                    borderRadius: 'var(--radius-md)',
                                    borderLeft: task.role === 'user'
                                        ? '3px solid var(--brand-blue)'
                                        : '3px solid var(--brand-green)',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: task.role === 'user' ? 'var(--brand-blue)' : 'var(--brand-green)',
                                        textTransform: 'uppercase',
                                        fontWeight: 600,
                                    }}>
                                        {task.role === 'user' ? 'User' : 'Agent'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                        {formatTime(task.timestamp)}
                                    </span>
                                </div>
                                <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                                    {task.content ? (task.content.length > 150 ? task.content.substring(0, 150) + '...' : task.content) : ''}
                                </p>
                            </div>
                        ))}

                        {tasks.length === 0 && (
                            <div className="empty-state">
                                <p style={{ color: 'var(--text-muted)' }}>No messages yet</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Agent Actions - Placeholder for now */
                <div className="card fade-in fade-in-delay-2">
                    <div className="card-header">
                        <h3 className="card-title">Agent Activity Summary</h3>
                    </div>

                    <div className="empty-state">
                        <Bot size={48} color="var(--text-disabled)" style={{ marginBottom: 'var(--space-md)' }} />
                        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                            Agent actions will be tracked when tool calls are implemented
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper component for the icon
function MessageSquare({ size, style }: { size: number; style: React.CSSProperties }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={style}
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    );
}
