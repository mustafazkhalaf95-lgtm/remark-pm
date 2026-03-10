'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './settings.module.css';

const navItems = [
    { href: '/settings', icon: '📊', label: 'نظرة عامة', labelEn: 'Overview' },
    { href: '/settings/organization', icon: '🏢', label: 'المنظمة', labelEn: 'Organization' },
    { href: '/settings/departments', icon: '🏗️', label: 'الأقسام', labelEn: 'Departments' },
    { href: '/settings/users', icon: '👥', label: 'المستخدمون', labelEn: 'Users' },
    { href: '/settings/positions', icon: '💼', label: 'المناصب', labelEn: 'Positions' },
    { href: '/settings/roles', icon: '🔐', label: 'الأدوار والصلاحيات', labelEn: 'Roles' },
    { href: '/settings/approvals', icon: '✅', label: 'مصفوفة الموافقات', labelEn: 'Approvals' },
    { href: '/settings/integrations', icon: '🔗', label: 'التكاملات', labelEn: 'Integrations' },
    { href: '/settings/security', icon: '🛡️', label: 'الأمان والسجل', labelEn: 'Security' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className={styles.settingsLayout} dir="rtl">
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Link href="/" className={styles.sidebarLogo}>
                        <div className={styles.logoIcon}>R</div>
                        <span className={styles.logoText}>Remark</span>
                    </Link>
                </div>
                <div className={styles.sidebarTitle}>الإعدادات</div>
                <nav className={styles.sidebarNav}>
                    {navItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={pathname === item.href ? styles.navItemActive : styles.navItem}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className={styles.sidebarFooter}>
                    <Link href="/" className={styles.backLink}>
                        ← العودة للوحة الرئيسية
                    </Link>
                </div>
            </aside>
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
