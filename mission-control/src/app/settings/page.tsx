'use client';

import { useState, useEffect } from 'react';
import { Save, Bot, Key, Clock, Database, Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const [personality, setPersonality] = useState('');
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                setPersonality(data.personality || '');
                setSettings(data.settings || {});
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchSettings();
    }, []);

    const handleSavePersonality = async () => {
        setSaving(true);
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'personality', value: personality }),
            });

            setSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Failed to save personality:', error);
            setSaving(false);
        }
    };

    const configItems = [
        { icon: Bot, label: 'LLM Provider', value: settings.llm_provider || 'gemini', category: 'Model' },
        { icon: Key, label: 'API Key', value: '••••••••••••••', category: 'Model' },
        { icon: Clock, label: 'Heartbeat Interval', value: settings.heartbeat_interval || '5 minutes', category: 'Schedule' },
        { icon: Clock, label: 'Content Sync Interval', value: settings.content_sync_interval || '1 hour', category: 'Schedule' },
        { icon: Database, label: 'Memory Type', value: 'SQLite + Supabase', category: 'Storage' },
        { icon: Database, label: 'Max Messages', value: settings.max_messages || '1000', category: 'Storage' },
    ];

    const groupedConfig = configItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, typeof configItems>);

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
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Configure your agent's personality and behavior</p>
            </div>

            {/* Personality Section */}
            <div className="card fade-in fade-in-delay-1" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="card-header">
                    <h3 className="card-title">Personality & Character</h3>
                    <button
                        className="btn btn-primary"
                        onClick={handleSavePersonality}
                        disabled={saving}
                    >
                        {saving ? (
                            <>Saving...</>
                        ) : saved ? (
                            <>
                                <Save size={16} />
                                Saved!
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                    This defines how your AI agent behaves and responds. Think of it as the soul of your agent.
                </p>
                <textarea
                    className="textarea"
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    style={{ minHeight: 300, fontFamily: 'monospace', fontSize: '0.875rem' }}
                />
            </div>

            {/* Configuration Entries */}
            {Object.entries(groupedConfig).map(([category, items]) => (
                <div key={category} className="card fade-in" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="card-header">
                        <h3 className="card-title">{category}</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.label}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 'var(--space-sm) var(--space-md)',
                                        backgroundColor: 'var(--bg-input)',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        transition: 'background-color var(--transition-fast)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                        <Icon size={18} color="var(--text-muted)" />
                                        <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                                    </div>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.value}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
