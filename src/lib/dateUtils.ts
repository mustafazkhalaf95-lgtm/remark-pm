/* ══════════════════════════════════════════════════════════
   Remark PM — Date & Timezone Utilities
   All date operations respect the organization's timezone.
   ══════════════════════════════════════════════════════════ */

const DEFAULT_TIMEZONE = 'Asia/Baghdad';

/**
 * Format a date in a specific timezone with bilingual support
 */
export function formatDateInTimezone(
    date: Date | string,
    timezone: string = DEFAULT_TIMEZONE,
    lang: 'ar' | 'en' = 'ar'
): string {
    const formatter = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-IQ' : 'en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
    return formatter.format(new Date(date));
}

/**
 * Format date only (no time)
 */
export function formatDate(
    date: Date | string,
    timezone: string = DEFAULT_TIMEZONE,
    lang: 'ar' | 'en' = 'ar'
): string {
    const formatter = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-IQ' : 'en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    return formatter.format(new Date(date));
}

/**
 * Get due date status relative to now
 */
export function getDueDateStatus(
    dueDate: string | Date,
    timezone: string = DEFAULT_TIMEZONE
): 'overdue' | 'due_today' | 'due_soon' | 'upcoming' {
    const now = new Date();
    const due = new Date(dueDate);

    // Convert to timezone-aware strings for comparison
    const nowStr = now.toLocaleDateString('en-US', { timeZone: timezone });
    const dueStr = due.toLocaleDateString('en-US', { timeZone: timezone });

    const nowDate = new Date(nowStr);
    const dueDate2 = new Date(dueStr);

    const diffDays = Math.floor((dueDate2.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'due_today';
    if (diffDays <= 2) return 'due_soon';
    return 'upcoming';
}

/**
 * Get human-readable relative time
 */
export function getRelativeTime(date: Date | string, lang: 'ar' | 'en' = 'ar'): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (lang === 'ar') {
        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
        return formatDate(date, DEFAULT_TIMEZONE, 'ar');
    }

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return formatDate(date, DEFAULT_TIMEZONE, 'en');
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(date: string | Date): boolean {
    return new Date(date) > new Date();
}

/**
 * Check if a date is within business hours (9 AM - 6 PM)
 */
export function isBusinessHours(
    timezone: string = DEFAULT_TIMEZONE
): boolean {
    const now = new Date();
    const hour = parseInt(
        now.toLocaleString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false })
    );
    return hour >= 9 && hour < 18;
}

/**
 * Get work days count between two dates (excluding weekends based on workWeek)
 */
export function getWorkDaysBetween(
    start: Date | string,
    end: Date | string,
    workWeek: string = 'sun-thu'
): number {
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Parse work days
    const dayMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
    const [startDay, endDay] = workWeek.split('-');
    const workStart = dayMap[startDay] ?? 0;
    const workEnd = dayMap[endDay] ?? 4;

    let count = 0;
    const current = new Date(startDate);
    while (current <= endDate) {
        const dayOfWeek = current.getDay();
        const isWorkDay =
            workStart <= workEnd
                ? dayOfWeek >= workStart && dayOfWeek <= workEnd
                : dayOfWeek >= workStart || dayOfWeek <= workEnd;
        if (isWorkDay) count++;
        current.setDate(current.getDate() + 1);
    }
    return count;
}
