'use client';
/* ══════════════════════════════════════════════════════════
   ProfileDropdown — Avatar button with user menu
   Shows dynamic initials, role badge, and sign-out option.
   ══════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks/useSession';
import styles from './ProfileDropdown.module.css';

function getInitials(name: string, nameAr?: string): string {
    // Try Arabic name first (for Arabic UI)
    const source = nameAr || name || '';
    if (!source.trim()) return '?';

    const parts = source.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + '.' + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
    ceo: 'الرئيس التنفيذي',
    coo: 'مدير العمليات',
    admin: 'مدير النظام',
    department_head: 'رئيس قسم',
    account_manager: 'مدير حسابات',
    marketing_manager: 'مدير تسويق',
    creative_director: 'المدير الإبداعي',
    production_manager: 'مدير الإنتاج',
    publishing_manager: 'مدير النشر',
    staff: 'موظف',
    reviewer: 'مراجع',
    viewer: 'مشاهد',
};

export default function ProfileDropdown() {
    const { user, loading, authenticated } = useCurrentUser();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open]);

    if (loading || !authenticated || !user) {
        return (
            <div className={styles.avatarButton} style={{ opacity: 0.5, cursor: 'default' }}>
                ...
            </div>
        );
    }

    const initials = getInitials(user.name, user.nameAr);
    const roleLabel = ROLE_LABELS[user.role] || user.role;

    const handleSignOut = () => {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        signOut({ callbackUrl: `${basePath}/login` });
    };

    return (
        <div ref={containerRef} className={styles.container}>
            <button
                className={`${styles.avatarButton} ${open ? styles.active : ''}`}
                onClick={() => setOpen(!open)}
                aria-label="قائمة المستخدم"
                title={user.name}
            >
                {initials}
            </button>

            {open && (
                <div className={styles.dropdown}>
                    {/* User Info */}
                    <div className={styles.userInfo}>
                        <div className={styles.userName}>{user.name}</div>
                        <div className={styles.userEmail}>{user.email}</div>
                        <span className={styles.userRole}>{roleLabel}</span>
                    </div>

                    {/* Menu Items */}
                    <div className={styles.menuItems}>
                        <Link
                            href="/settings"
                            className={styles.menuItem}
                            onClick={() => setOpen(false)}
                        >
                            <span className={styles.menuIcon}>⚙️</span>
                            الإعدادات
                        </Link>

                        <Link
                            href="/settings/users"
                            className={styles.menuItem}
                            onClick={() => setOpen(false)}
                        >
                            <span className={styles.menuIcon}>👤</span>
                            الملف الشخصي
                        </Link>

                        <div className={styles.divider} />

                        <button
                            className={styles.logoutItem}
                            onClick={handleSignOut}
                        >
                            <span className={styles.menuIcon}>🚪</span>
                            تسجيل الخروج
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
