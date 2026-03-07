'use client';

import { useState, useEffect, useRef } from 'react';
import { Brain, Plus, Search, FileText, Link, Upload, Tag, Clock, X, Loader2, ChevronDown, PlusCircle } from 'lucide-react';

interface Memory {
    id: string;
    content: string;
    category: string;
    type: 'note' | 'url' | 'file';
    createdAt: string;
    metadata?: {
        title: string;
        thumbnail: string;
        channel?: string;
        videoId?: string;
    };
}

export default function BrainPage() {
    const [activeTab, setActiveTab] = useState<'note' | 'url' | 'file'>('note');
    const [memories, setMemories] = useState<Memory[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowCategoryDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch facts from API
    const fetchFacts = async () => {
        try {
            const res = await fetch('/api/facts');
            const data = await res.json();
            setMemories(data.facts || []);
        } catch (error) {
            console.error('Failed to fetch facts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFacts();
    }, []);

    const filteredMemories = memories.filter(m =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const categories = [...new Set(memories.map(m => m.category))];

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'note': return 'var(--brand-blue)';
            case 'url': return 'var(--brand-green)';
            case 'file': return 'var(--brand-orange)';
            default: return 'var(--text-muted)';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'note': return FileText;
            case 'url': return Link;
            case 'file': return Upload;
            default: return FileText;
        }
    };

    // Get unique categories from existing memories
    const existingCategories = [...new Set(memories.map(m => m.category).filter(Boolean))];

    const handleCategorySelect = (category: string) => {
        if (category === '__add_new__') {
            setIsAddingNewCategory(true);
            setNewCategory('');
        } else {
            setNewCategory(category);
            setIsAddingNewCategory(false);
        }
        setShowCategoryDropdown(false);
    };

    const handleAddMemory = async () => {
        if (!newContent.trim()) return;

        setSaving(true);
        try {
            const id = `fact_${Date.now()}`;
            await fetch('/api/facts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    fact: newContent,
                    type: activeTab,
                    category: newCategory || (activeTab === 'url' ? 'links' : 'general')
                }),
            });

            setNewContent('');
            setNewCategory('');
            setIsAddingNewCategory(false);
            fetchFacts();
        } catch (error) {
            console.error('Failed to add memory:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteMemory = async (id: string) => {
        try {
            await fetch(`/api/facts?id=${id}`, { method: 'DELETE' });
            fetchFacts();
        } catch (error) {
            console.error('Failed to delete memory:', error);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="page">
            <div className="page-header fade-in">
                <h1 className="page-title">Second Brain</h1>
                <p className="page-subtitle">Your agent's knowledge base</p>
            </div>

            {/* Stats */}
            <div className="grid-3 fade-in fade-in-delay-1" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="stat-card">
                    <div className="stat-value">{memories.length}</div>
                    <div className="stat-label">Stored Facts</div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-value">{categories.length}</div>
                    <div className="stat-label">Categories</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-value">0</div>
                    <div className="stat-label">Queued Items</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
                {/* Add New Section */}
                <div className="card fade-in fade-in-delay-2">
                    <div className="card-header">
                        <h3 className="card-title">Add New Memory</h3>
                    </div>

                    {/* Type Tabs */}
                    <div className="tabs" style={{ marginBottom: 'var(--space-md)' }}>
                        <button
                            className={`tab ${activeTab === 'note' ? 'active' : ''}`}
                            onClick={() => setActiveTab('note')}
                        >
                            <FileText size={14} style={{ marginRight: 6 }} />
                            Quick Note
                        </button>
                        <button
                            className={`tab ${activeTab === 'url' ? 'active' : ''}`}
                            onClick={() => setActiveTab('url')}
                        >
                            <Link size={14} style={{ marginRight: 6 }} />
                            URL
                        </button>
                        <button
                            className={`tab ${activeTab === 'file' ? 'active' : ''}`}
                            onClick={() => setActiveTab('file')}
                        >
                            <Upload size={14} style={{ marginRight: 6 }} />
                            File
                        </button>
                    </div>

                    <textarea
                        className="textarea"
                        placeholder={
                            activeTab === 'note' ? 'Write your note here...' :
                                activeTab === 'url' ? 'Paste a URL here...' :
                                    'Drag and drop files here...'
                        }
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        style={{ minHeight: 120, marginBottom: 'var(--space-md)' }}
                    />

                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        {/* Category Dropdown */}
                        <div style={{ flex: 1, position: 'relative' }} ref={dropdownRef}>
                            {isAddingNewCategory ? (
                                <input
                                    className="input"
                                    placeholder="Type new category name..."
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    autoFocus
                                    onBlur={() => {
                                        if (!newCategory.trim()) {
                                            setIsAddingNewCategory(false);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setIsAddingNewCategory(false);
                                            setNewCategory('');
                                        }
                                    }}
                                />
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className="input"
                                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <span style={{ color: newCategory ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                            {newCategory || 'Select category...'}
                                        </span>
                                        <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                                    </button>
                                    {showCategoryDropdown && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            backgroundColor: 'var(--bg-input)',
                                            border: '1px solid var(--border-default)',
                                            borderRadius: 'var(--radius-md)',
                                            marginTop: 4,
                                            zIndex: 100,
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                        }}>
                                            {existingCategories.length > 0 ? (
                                                existingCategories.map((cat) => (
                                                    <div
                                                        key={cat}
                                                        onClick={() => handleCategorySelect(cat)}
                                                        style={{
                                                            padding: 'var(--space-sm) var(--space-md)',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 'var(--space-sm)',
                                                            color: 'var(--text-primary)',
                                                            transition: 'background-color 0.15s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <Tag size={14} style={{ color: 'var(--text-muted)' }} />
                                                        {cat}
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ padding: 'var(--space-md)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                    No categories yet
                                                </div>
                                            )}
                                            <div
                                                onClick={() => handleCategorySelect('__add_new__')}
                                                style={{
                                                    padding: 'var(--space-sm) var(--space-md)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--space-sm)',
                                                    color: 'var(--brand-blue)',
                                                    borderTop: '1px solid var(--border-default)',
                                                    fontWeight: 500,
                                                    transition: 'background-color 0.15s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <PlusCircle size={14} />
                                                Add new category
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={handleAddMemory}
                            disabled={saving || !newContent.trim()}
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Add
                        </button>
                    </div>

                    {/* Drop Zone */}
                    {activeTab === 'file' && (
                        <div style={{
                            marginTop: 'var(--space-md)',
                            padding: 'var(--space-xl)',
                            border: '2px dashed var(--border-default)',
                            borderRadius: 'var(--radius-md)',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                        }}>
                            <Upload size={24} style={{ marginBottom: 'var(--space-sm)' }} />
                            <p>Drag and drop files here</p>
                        </div>
                    )}
                </div>

                {/* Search & List */}
                <div className="card fade-in fade-in-delay-3">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Brain size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                            Stored Memories
                        </h3>
                    </div>

                    {/* Search */}
                    <div style={{ position: 'relative', marginBottom: 'var(--space-md)' }}>
                        <Search size={18} style={{
                            position: 'absolute',
                            left: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)'
                        }} />
                        <input
                            className="input"
                            placeholder="Search memories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: 40 }}
                        />
                    </div>

                    {/* Memory List */}
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-xl)' }}>
                            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                        </div>
                    ) : filteredMemories.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', maxHeight: 400, overflowY: 'auto' }}>
                            {filteredMemories.map(memory => {
                                const TypeIcon = getTypeIcon(memory.type);
                                return (
                                    <div
                                        key={memory.id}
                                        style={{
                                            padding: 'var(--space-md)',
                                            backgroundColor: 'var(--bg-input)',
                                            borderRadius: 'var(--radius-md)',
                                            borderLeft: `3px solid ${getTypeColor(memory.type)}`,
                                        }}
                                    >
                                        {/* URL with metadata - show thumbnail card */}
                                        {memory.type === 'url' && memory.metadata?.thumbnail ? (
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                                                    <TypeIcon size={14} color={getTypeColor(memory.type)} />
                                                    <span className="badge" style={{
                                                        backgroundColor: `${getTypeColor(memory.type)}20`,
                                                        color: getTypeColor(memory.type),
                                                        fontSize: '0.625rem',
                                                    }}>
                                                        {memory.type}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        <Tag size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                                        {memory.category}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDeleteMemory(memory.id)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginLeft: 'auto' }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                {/* YouTube video card */}
                                                <a
                                                    href={memory.content}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                                >
                                                    <div style={{
                                                        display: 'flex',
                                                        gap: 'var(--space-sm)',
                                                        marginTop: 'var(--space-xs)',
                                                        padding: 'var(--space-sm)',
                                                        backgroundColor: 'var(--bg-hover)',
                                                        borderRadius: 'var(--radius-sm)',
                                                    }}>
                                                        <img
                                                            src={memory.metadata.thumbnail}
                                                            alt={memory.metadata.title}
                                                            style={{
                                                                width: '120px',
                                                                height: '68px',
                                                                objectFit: 'cover',
                                                                borderRadius: 'var(--radius-sm)'
                                                            }}
                                                        />
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{
                                                                color: 'var(--text-primary)',
                                                                fontSize: '0.875rem',
                                                                fontWeight: 500,
                                                                margin: 0,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical'
                                                            }}>
                                                                {memory.metadata.title}
                                                            </p>
                                                            {memory.metadata.channel && (
                                                                <p style={{
                                                                    color: 'var(--text-muted)',
                                                                    fontSize: '0.75rem',
                                                                    margin: '4px 0 0 0'
                                                                }}>
                                                                    {memory.metadata.channel}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </a>
                                            </div>
                                        ) : (
                                            /* Regular URL or note - show simple card */
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                                                        <TypeIcon size={14} color={getTypeColor(memory.type)} />
                                                        <span className="badge" style={{
                                                            backgroundColor: `${getTypeColor(memory.type)}20`,
                                                            color: getTypeColor(memory.type),
                                                            fontSize: '0.625rem',
                                                        }}>
                                                            {memory.type}
                                                        </span>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            <Tag size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                                            {memory.category}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteMemory(memory.id)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                {memory.type === 'url' ? (
                                                    <a
                                                        href={memory.content}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            color: 'var(--brand-blue)',
                                                            fontSize: '0.875rem',
                                                            wordBreak: 'break-all'
                                                        }}
                                                    >
                                                        {memory.content}
                                                    </a>
                                                ) : (
                                                    <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                                                        {memory.content}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 'var(--space-sm)' }}>
                                            <Clock size={12} color="var(--text-disabled)" />
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-disabled)' }}>
                                                {formatDate(memory.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
                            <p style={{ color: 'var(--text-muted)' }}>
                                {searchQuery ? 'No memories found matching your search' : 'No memories yet. Add your first one!'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
