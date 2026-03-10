/* ══════════════════════════════════════════════════════════
   Remark PM — Unified Deadline Engine
   Calculates all derived dates from publishDate as master anchor.

   Timeline:
     publishDate           → master anchor (set by marketing/account manager)
     creativeDeadline      → publishDate - 7 days
     productionSafetyDate  → publishDate - 3 days
     productionStartDate   → productionSafetyDate - 2 days (48h execution window)
     liveDeliveryDeadline  → shoot completion + 24 hours

   All boards stay synchronized with these dates.
   ══════════════════════════════════════════════════════════ */

export interface DeadlineConfig {
    creativeDaysBefore: number;  // default 7
    productionSafetyDays: number; // default 3
    productionWindowHours: number; // default 48
    liveDeliveryHours: number;    // default 24
}

export const DEFAULT_DEADLINE_CONFIG: DeadlineConfig = {
    creativeDaysBefore: 7,
    productionSafetyDays: 3,
    productionWindowHours: 48,
    liveDeliveryHours: 24,
};

export interface CalculatedDeadlines {
    publishDate: Date;
    creativeDeadline: Date;
    productionSafetyDate: Date;
    productionStartDate: Date;
}

/**
 * Calculate all derived deadlines from a publish date.
 */
export function calculateDeadlines(
    publishDate: Date | string,
    config: DeadlineConfig = DEFAULT_DEADLINE_CONFIG
): CalculatedDeadlines {
    const pd = new Date(publishDate);

    const creativeDeadline = new Date(pd);
    creativeDeadline.setDate(pd.getDate() - config.creativeDaysBefore);

    const productionSafetyDate = new Date(pd);
    productionSafetyDate.setDate(pd.getDate() - config.productionSafetyDays);

    const productionStartDate = new Date(productionSafetyDate);
    productionStartDate.setHours(productionSafetyDate.getHours() - config.productionWindowHours);

    return { publishDate: pd, creativeDeadline, productionSafetyDate, productionStartDate };
}

/**
 * Calculate live delivery deadline (24h after shoot completion).
 */
export function calculateLiveDeliveryDeadline(
    shootCompletedAt: Date | string,
    config: DeadlineConfig = DEFAULT_DEADLINE_CONFIG
): Date {
    const d = new Date(shootCompletedAt);
    d.setHours(d.getHours() + config.liveDeliveryHours);
    return d;
}

/**
 * Check if a deadline is overdue.
 */
export function isOverdue(deadline: Date | string): boolean {
    return new Date(deadline) < new Date();
}

/**
 * Check if a deadline is approaching (within N hours).
 */
export function isApproaching(deadline: Date | string, withinHours = 24): boolean {
    const d = new Date(deadline);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    return diff > 0 && diff < withinHours * 3600000;
}

/**
 * Get urgency level for a deadline.
 */
export function getDeadlineUrgency(deadline: Date | string): 'overdue' | 'urgent' | 'warning' | 'normal' {
    if (isOverdue(deadline)) return 'overdue';
    if (isApproaching(deadline, 12)) return 'urgent';
    if (isApproaching(deadline, 48)) return 'warning';
    return 'normal';
}

/**
 * Format relative time (e.g., "في ٣ أيام" / "In 3 days").
 */
export function formatRelativeTime(date: Date | string, lang: 'ar' | 'en' = 'ar'): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / 86400000);
    const diffHours = Math.round(diffMs / 3600000);

    if (lang === 'ar') {
        if (diffDays < -1) return `متأخر ${Math.abs(diffDays)} يوم`;
        if (diffDays === -1) return 'متأخر يوم واحد';
        if (diffDays === 0) {
            if (diffHours < 0) return `متأخر ${Math.abs(diffHours)} ساعة`;
            if (diffHours === 0) return 'الآن';
            return `خلال ${diffHours} ساعة`;
        }
        if (diffDays === 1) return 'غداً';
        return `خلال ${diffDays} يوم`;
    }

    if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === -1) return '1 day overdue';
    if (diffDays === 0) {
        if (diffHours < 0) return `${Math.abs(diffHours)}h overdue`;
        if (diffHours === 0) return 'Now';
        return `In ${diffHours}h`;
    }
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
}
