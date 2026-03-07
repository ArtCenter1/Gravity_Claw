'use client';

import { useState, useEffect } from 'react';
import { Save, Bot, Clock, Database, Loader2 } from 'lucide-react';

// Provider model info type (simplified from @/llm/types)
interface ProviderModelInfo {
    id: string;
    name: string;
    provider: string;
    description: string;
}

// Available models by provider (simplified)
const PROVIDER_MODELS: Record<string, ProviderModelInfo[]> = {
    google: [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', description: 'Fast Google model' },
        { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash', provider: 'google', description: 'Latest Flash preview' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', description: 'High capability' },
    ],
    openai: [
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Latest GPT-4 with vision' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'Fast & cheap GPT-4' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', description: 'Previous GPT-4' },
    ],
    anthropic: [
        { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', description: 'Latest Claude Sonnet' },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', description: 'Fast & capable' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', description: 'Fast & cheap' },
    ],
    deepseek: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek', description: 'DeepSeek V3' },
        { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'deepseek', description: 'Code specialized' },
    ],
    groq: [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'groq', description: 'Meta Llama via Groq' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'groq', description: 'Mistral via Groq' },
    ],
    ollama: [
        { id: 'llama3', name: 'Llama 3', provider: 'ollama', description: 'Meta Llama 3 (local)' },
        { id: 'mistral', name: 'Mistral', provider: 'ollama', description: 'Mistral (local)' },
        { id: 'codellama', name: 'CodeLlama', provider: 'ollama', description: 'Code specialized (local)' },
    ],
    openrouter: [
        { id: 'openai/gpt-4o', name: 'GPT-4o (OpenRouter)', provider: 'openrouter', description: 'OpenRouter GPT-4o' },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OpenRouter)', provider: 'openrouter', description: 'OpenRouter Claude 3.5 Sonnet' },
        { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (OpenRouter)', provider: 'openrouter', description: 'OpenRouter Gemini 2.0 Flash' },
    ],
    failover: [
        { id: 'failover-auto', name: 'Automatic Failover', provider: 'failover', description: 'Priority: Anthropic > OpenAI > Google' },
    ],
};

export default function SettingsPage() {
    const [personality, setPersonality] = useState('');
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [savingPersonality, setSavingPersonality] = useState(false);
    const [savedPersonality, setSavedPersonality] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [savedSettings, setSavedSettings] = useState(false);
    const [editingSettings, setEditingSettings] = useState<Record<string, string>>({});

    // Available LLM providers
    const providers = [
        { value: 'google', label: 'Google (Gemini)' },
        { value: 'openai', label: 'OpenAI' },
        { value: 'anthropic', label: 'Anthropic (Claude)' },
        { value: 'deepseek', label: 'DeepSeek' },
        { value: 'groq', label: 'Groq' },
        { value: 'ollama', label: 'Ollama (Local)' },
        { value: 'openrouter', label: 'OpenRouter' },
        { value: 'failover', label: 'Model Failover' },
    ];

    // Get models for selected provider
    const getModelsForProvider = (provider: string) => {
        return PROVIDER_MODELS[provider] || [];
    };

    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                setPersonality(data.personality || '');
                setSettings(data.settings || {});
                setEditingSettings(data.settings || {});
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchSettings();
    }, []);

    const handleSavePersonality = async () => {
        setSavingPersonality(true);
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'personality', value: personality }),
            });

            setSavingPersonality(false);
            setSavedPersonality(true);
            setTimeout(() => setSavedPersonality(false), 2000);
        } catch (error) {
            console.error('Failed to save personality:', error);
            setSavingPersonality(false);
        }
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            // Save each setting that changed
            for (const [key, value] of Object.entries(editingSettings)) {
                if (settings[key] !== value) {
                    await fetch('/api/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'setting', key, value }),
                    });
                }
            }
            setSettings({ ...editingSettings });
            setSavingSettings(false);
            setSavedSettings(true);

            // Trigger sidebar refresh
            window.dispatchEvent(new Event('settings-updated'));

            setTimeout(() => setSavedSettings(false), 2000);
        } catch (error) {
            console.error('Failed to save settings:', error);
            setSavingSettings(false);
        }
    };

    const updateSetting = (key: string, value: string) => {
        setEditingSettings(prev => ({ ...prev, [key]: value }));
    };

    const currentProvider = editingSettings.llm_provider || 'google';
    const availableModels = getModelsForProvider(currentProvider);

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
                        disabled={savingPersonality}
                    >
                        {savingPersonality ? (
                            <>Saving...</>
                        ) : savedPersonality ? (
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
                    style={{ minHeight: 400, fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.6' }}
                />
            </div>

            {/* Model Configuration */}
            <div className="card fade-in" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-header">
                    <h3 className="card-title">Model Configuration</h3>
                    <button
                        className="btn btn-primary"
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                    >
                        {savingSettings ? (
                            <>Saving...</>
                        ) : savedSettings ? (
                            <>
                                <Save size={16} />
                                Saved!
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {/* LLM Provider */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--space-md)',
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <Bot size={18} color="var(--text-muted)" />
                            <span style={{ color: 'var(--text-secondary)' }}>LLM Provider</span>
                        </div>
                        <select
                            value={editingSettings.llm_provider || 'google'}
                            onChange={(e) => {
                                const newProvider = e.target.value;
                                const models = getModelsForProvider(newProvider);
                                updateSetting('llm_provider', newProvider);
                                // Auto-select first model of new provider if current model not available
                                if (models.length > 0 && !models.find(m => m.id === editingSettings.model)) {
                                    updateSetting('model', models[0].id);
                                }
                            }}
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                padding: 'var(--space-sm) var(--space-md)',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                minWidth: 180,
                            }}
                        >
                            {providers.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Model Selection */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--space-md)',
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <Bot size={18} color="var(--text-muted)" />
                            <span style={{ color: 'var(--text-secondary)' }}>Model</span>
                        </div>
                        <select
                            value={editingSettings.model || availableModels[0]?.id || ''}
                            onChange={(e) => updateSetting('model', e.target.value)}
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                padding: 'var(--space-sm) var(--space-md)',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                minWidth: 220,
                            }}
                        >
                            {availableModels.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Max Output Tokens */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--space-md)',
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <Bot size={18} color="var(--text-muted)" />
                            <span style={{ color: 'var(--text-secondary)' }}>Max Output Tokens</span>
                        </div>
                        <input
                            type="number"
                            value={editingSettings.max_output_tokens || '4096'}
                            onChange={(e) => updateSetting('max_output_tokens', e.target.value)}
                            min={256}
                            max={100000}
                            step={256}
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                padding: 'var(--space-sm) var(--space-md)',
                                fontSize: '0.875rem',
                                width: 120,
                                textAlign: 'right',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Schedule Configuration */}
            <div className="card fade-in" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-header">
                    <h3 className="card-title">Schedule</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {/* Heartbeat Morning */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--space-md)',
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <Clock size={18} color="var(--text-muted)" />
                            <span style={{ color: 'var(--text-secondary)' }}>Heartbeat (Morning)</span>
                        </div>
                        <input
                            type="text"
                            value={editingSettings.heartbeat_morning_cron || '0 9 * * *'}
                            onChange={(e) => updateSetting('heartbeat_morning_cron', e.target.value)}
                            placeholder="0 9 * * *"
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                padding: 'var(--space-sm) var(--space-md)',
                                fontSize: '0.875rem',
                                width: 150,
                                fontFamily: 'monospace',
                            }}
                        />
                    </div>

                    {/* Heartbeat Afternoon */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--space-md)',
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <Clock size={18} color="var(--text-muted)" />
                            <span style={{ color: 'var(--text-secondary)' }}>Heartbeat (Afternoon)</span>
                        </div>
                        <input
                            type="text"
                            value={editingSettings.heartbeat_afternoon_cron || '0 15 * * *'}
                            onChange={(e) => updateSetting('heartbeat_afternoon_cron', e.target.value)}
                            placeholder="0 15 * * *"
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                padding: 'var(--space-sm) var(--space-md)',
                                fontSize: '0.875rem',
                                width: 150,
                                fontFamily: 'monospace',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Storage Configuration */}
            <div className="card fade-in" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-header">
                    <h3 className="card-title">Storage</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {/* Memory Type (display only) */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--space-md)',
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <Database size={18} color="var(--text-muted)" />
                            <span style={{ color: 'var(--text-secondary)' }}>Memory Type</span>
                        </div>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>SQLite + Supabase</span>
                    </div>

                    {/* Max History Messages */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--space-md)',
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <Database size={18} color="var(--text-muted)" />
                            <span style={{ color: 'var(--text-secondary)' }}>Max History Messages</span>
                        </div>
                        <input
                            type="number"
                            value={editingSettings.max_messages || '100'}
                            onChange={(e) => updateSetting('max_messages', e.target.value)}
                            min={10}
                            max={10000}
                            step={10}
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                padding: 'var(--space-sm) var(--space-md)',
                                fontSize: '0.875rem',
                                width: 100,
                                textAlign: 'right',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Cron Help */}
            <div className="card fade-in" style={{ marginBottom: 'var(--space-lg)', backgroundColor: 'var(--bg-elevated)' }}>
                <div className="card-header">
                    <h3 className="card-title">Cron Expression Help</h3>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--space-md)',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)'
                }}>
                    <div>
                        <strong style={{ color: 'var(--text-secondary)' }}>Common Examples:</strong>
                        <ul style={{ marginTop: 'var(--space-sm)', paddingLeft: 'var(--space-lg)', lineHeight: 1.8 }}>
                            <li><code style={{ fontFamily: 'monospace' }}>0 9 * * *</code> - Daily at 9:00 AM</li>
                            <li><code style={{ fontFamily: 'monospace' }}>0 15 * * *</code> - Daily at 3:00 PM</li>
                            <li><code style={{ fontFamily: 'monospace' }}>0 9,15 * * *</code> - Twice daily</li>
                            <li><code style={{ fontFamily: 'monospace' }}>0 9 * * 1-5</code> - Weekdays at 9 AM</li>
                        </ul>
                    </div>
                    <div>
                        <strong style={{ color: 'var(--text-secondary)' }}>Format:</strong>
                        <ul style={{ marginTop: 'var(--space-sm)', paddingLeft: 'var(--space-lg)', lineHeight: 1.8 }}>
                            <li><code style={{ fontFamily: 'monospace' }}>┌──── minute (0-59)</code></li>
                            <li><code style={{ fontFamily: 'monospace' }}>│┌─── hour (0-23)</code></li>
                            <li><code style={{ fontFamily: 'monospace' }}>││┌─ day of month (1-31)</code></li>
                            <li><code style={{ fontFamily: 'monospace' }}>│││┌─ month (1-12)</code></li>
                            <li><code style={{ fontFamily: 'monospace' }}>││││┌─ day of week (0-6)</code></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
