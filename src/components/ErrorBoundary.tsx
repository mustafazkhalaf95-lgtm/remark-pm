'use client';

import React from 'react';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minHeight: '200px', padding: '40px', textAlign: 'center',
                    background: 'rgba(239,68,68,0.05)', borderRadius: '16px', margin: '20px',
                    border: '1px solid rgba(239,68,68,0.15)',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ef4444', marginBottom: '8px' }}>
                        حدث خطأ غير متوقع
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px', maxWidth: '400px' }}>
                        {this.state.error?.message || 'Something went wrong'}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        style={{
                            padding: '10px 24px', borderRadius: '10px', border: 'none',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '14px',
                        }}
                    >
                        إعادة المحاولة
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
