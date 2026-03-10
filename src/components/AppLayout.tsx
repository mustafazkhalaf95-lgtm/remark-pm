'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
    { href: '/', label: 'التسويق', labelEn: 'Marketing', icon: '📊' },
    { href: '/creative', label: 'الإبداعي', labelEn: 'Creative', icon: '🎨' },
    { href: '/production', label: 'البرودكشن', labelEn: 'Production', icon: '🎬' },
    { href: '/publishing', label: 'النشر', labelEn: 'Publishing', icon: '📢' },
    { href: '/finance', label: 'المالية', labelEn: 'Finance', icon: '💰' },
    { href: '/timesheet', label: 'الوقت', labelEn: 'Time', icon: '⏱️' },
    { href: '/analytics', label: 'التحليلات', labelEn: 'Analytics', icon: '📈' },
    { href: '/files', label: 'الملفات', labelEn: 'Files', icon: '📁' },
    { href: '/timeline', label: 'الجدول', labelEn: 'Timeline', icon: '🗓️' },
    { href: '/calendar', label: 'التقويم', labelEn: 'Calendar', icon: '📅' },
    { href: '/chat', label: 'المحادثات', labelEn: 'Chat', icon: '💬' },
    { href: '/hr', label: 'HR', labelEn: 'HR', icon: '👥' },
    { href: '/wiki', label: 'المعرفة', labelEn: 'Wiki', icon: '📚' },
    { href: '/automations', label: 'الأتمتة', labelEn: 'Automations', icon: '⚡' },
    { href: '/portal', label: 'البوابة', labelEn: 'Portal', icon: '🌐' },
    { href: '/admin', label: 'الإدارة', labelEn: 'Admin', icon: '⚙️' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Top Nav Bar */}
            <nav style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                position: 'sticky', top: 0, zIndex: 100,
                overflowX: 'auto',
            }}>
                <Link href="/" style={{ fontWeight: 800, fontSize: '18px', color: '#6366f1', textDecoration: 'none', marginLeft: '12px', marginRight: '12px' }}>
                    Remark
                </Link>
                {NAV_ITEMS.map(item => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link key={item.href} href={item.href} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 14px', borderRadius: '10px',
                            fontSize: '13px', fontWeight: isActive ? 700 : 500,
                            color: isActive ? '#6366f1' : '#64748b',
                            background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                            textDecoration: 'none', whiteSpace: 'nowrap',
                            transition: 'all 0.2s',
                        }}>
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
            {/* Content */}
            <main style={{ flex: 1 }}>
                {children}
            </main>
        </div>
    );
}
