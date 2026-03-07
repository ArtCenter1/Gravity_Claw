'use client';

import { PlayCircle, Eye, ThumbsUp, TrendingUp, Info } from 'lucide-react';

export default function ContentPage() {
    return (
        <div className="page">
            <div className="page-header fade-in">
                <h1 className="page-title">Content Intel</h1>
                <p className="page-subtitle">Analytics for your content platform</p>
            </div>

            {/* Hero Stats */}
            <div className="grid-3 fade-in fade-in-delay-1">
                <div className="stat-card">
                    <div className="stat-value">0</div>
                    <div className="stat-label">Videos/Posts Tracked</div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-value">0</div>
                    <div className="stat-label">Total Views</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-value">0%</div>
                    <div className="stat-label">Engagement Rate</div>
                </div>
            </div>

            {/* Outlier Baseline */}
            <div className="card fade-in fade-in-delay-2" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="card-header">
                    <h3 className="card-title">Performance Baseline</h3>
                    <span className="badge badge-info">Last 15 pieces</span>
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                    Average performance across recent content
                </p>

                <div style={{
                    height: 40,
                    backgroundColor: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        No content data yet — sync from your platform to see analytics
                    </span>
                </div>
            </div>

            {/* Content Grid */}
            <div className="card fade-in fade-in-delay-3" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="card-header">
                    <h3 className="card-title">Recent Content</h3>
                </div>

                <div className="empty-state">
                    <PlayCircle size={48} color="var(--text-disabled)" style={{ marginBottom: 'var(--space-md)' }} />
                    <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                        Connect a content platform to start tracking analytics
                    </p>
                    <button className="btn btn-secondary">
                        Connect Platform
                    </button>
                </div>
            </div>

            {/* Info Box */}
            <div className="card fade-in fade-in-delay-4" style={{ marginTop: 'var(--space-xl)', borderColor: 'var(--brand-blue)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                    <Info size={24} color="var(--brand-blue)" />
                    <div>
                        <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>How Content Intel Works</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Content Intel tracks performance metrics from your connected platforms (YouTube, LinkedIn, etc.).
                            The outlier score shows how each piece of content performs compared to your baseline —
                            green scores (3×+) indicate viral content, while red scores indicate below-average performance.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
