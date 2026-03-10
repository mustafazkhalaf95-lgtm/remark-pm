'use client';
/* ══════════════════════════════════════════════════════════
   AppLayout — Responsive navigation with role-based filtering
   ══════════════════════════════════════════════════════════ */

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrentUser, useHasRole } from '@/lib/hooks/useSession';
import ProfileDropdown from './ProfileDropdown';
import AiAssistantPanel from './AiAssistantPanel';
import styles from './AppLayout.module.css';

interface NavItem {
    href: string;
    label: string;
    labelEn: string;
    icon: string;
    /** Roles that can see this item. Empty = everyone */
    roles?: string[];
    /** Permission code required */
    permission?: string;
}

const NAV_ITEMS: NavItem[] = [
    { href: '/', label: 'التسويق', labelEn: 'Marketing', icon: '📊', permission: 'marketing.view' },
    { href: '/creative', label: 'الإبداعي', labelEn: 'Creative', icon: '🎨', permission: 'creative.view' },
    { href: '/production', label: 'البرودكشن', labelEn: 'Production', icon: '🎬', permission: 'production.view' },
    { href: '/publishing', label: 'النشر', labelEn: 'Publishing', icon: '📢', permission: 'publishing.view' },
    { href: '/finance', label: 'المالية', labelEn: 'Finance', icon: '💰' },
    { href: '/timesheet', label: 'الوقت', labelEn: 'Time', icon: '⏱️' },
    { href: '/analytics', label: 'التحليلات', labelEn: 'Analytics', icon: '📈' },
    { href: '/files', label: 'الملفات', labelEn: 'Files', icon: '📁' },
    { href: '/timeline', label: 'الجدول', labelEn: 'Timeline', icon: '🗓️' },
    { href: '/calendar', label: 'التقويم', labelEn: 'Calendar', icon: '📅' },
    { href: '/chat', label: 'المحادثات', labelEn: 'Chat', icon: '💬' },
    { href: '/hr', label: 'HR', labelEn: 'HR', icon: '👥' },
    { href: '/wiki', label: 'المعرفة', labelEn: 'Wiki', icon: '📚' },
    { href: '/automations', label: 'الأتمتة', labelEn: 'Automations', icon: '⚡', roles: ['ceo', 'coo', 'admin'] },
    { href: '/portal', label: 'البوابة', labelEn: 'Portal', icon: '🌐', roles: ['ceo', 'coo', 'admin', 'account_manager'] },
    { href: '/settings', label: 'الإعدادات', labelEn: 'Settings', icon: '⚙️', roles: ['ceo', 'coo', 'admin'] },
];

/** Admin/executive roles that see everything */
const ADMIN_ROLES = ['ceo', 'coo', 'admin'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useCurrentUser();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const isAdmin = useHasRole(ADMIN_ROLES);

    const closeDrawer = useCallback(() => setDrawerOpen(false), []);

    // Filter nav items based on user role/permissions
    const visibleItems = NAV_ITEMS.filter(item => {
        if (isAdmin) return true;
        if (item.roles && user && !item.roles.some(r => user.roles.includes(r) || user.role === r)) {
            return false;
        }
        if (item.permission && user && !user.permissions.includes(item.permission)) {
            return false;
        }
        return true;
    });

    const isActive = (href: string) =>
        pathname === href || (href !== '/' && pathname.startsWith(href));

    return (
        <div className={styles.wrapper}>
            {/* ── Top Nav Bar ── */}
            <nav className={styles.nav}>
                <Link href="/" className={styles.logo}>Remark</Link>

                {/* Desktop nav links */}
                <div className={styles.navLinks}>
                    {visibleItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={isActive(item.href) ? styles.navItemActive : styles.navItem}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </div>

                <div className={styles.spacer} />

                {/* Profile dropdown */}
                <ProfileDropdown />

                {/* Hamburger — visible on mobile */}
                <button
                    className={styles.hamburger}
                    onClick={() => setDrawerOpen(true)}
                    aria-label="القائمة"
                >
                    ☰
                </button>
            </nav>

            {/* ── Mobile Drawer ── */}
            <div
                className={`${styles.drawerBackdrop} ${drawerOpen ? styles.open : ''}`}
                onClick={closeDrawer}
            />
            {drawerOpen && (
                <div className={styles.drawer}>
                    <div className={styles.drawerHeader}>
                        <span className={styles.drawerLogo}>Remark</span>
                        <button className={styles.drawerClose} onClick={closeDrawer}>✕</button>
                    </div>
                    <div className={styles.drawerLinks}>
                        {visibleItems.map(item => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={isActive(item.href) ? styles.drawerItemActive : styles.drawerItem}
                                onClick={closeDrawer}
                            >
                                <span className={styles.drawerItemIcon}>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>
                    <div className={styles.drawerFooter}>
                        <ProfileDropdown />
                    </div>
                </div>
            )}

            {/* ── Content ── */}
            <main className={styles.main}>
                {children}
            </main>

            {/* ── AI Assistant ── */}
            <AiAssistantPanel />
        </div>
    );
}
