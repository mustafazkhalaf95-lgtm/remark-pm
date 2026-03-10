'use client';

import React, { useState, useEffect, useCallback } from 'react';

const bg = 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)';
const glass = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' };

const EVENT_TYPES = [
    { value: 'meeting', label: 'اجتماع', color: '#6366f1', icon: '🤝' },
    { value: 'deadline', label: 'موعد نهائي', color: '#ef4444', icon: '⏰' },
    { value: 'shoot', label: 'تصوير', color: '#f59e0b', icon: '📸' },
    { value: 'review', label: 'مراجعة', color: '#22c55e', icon: '✅' },
    { value: 'reminder', label: 'تذكير', color: '#8b5cf6', icon: '🔔' },
    { value: 'holiday', label: 'عطلة', color: '#ec4899', icon: '🏖️' },
];

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'week' | 'day'>('month');
    const [events, setEvents] = useState<any[]>([]);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState<any>(null);
    const [form, setForm] = useState({
        title: '', titleAr: '', description: '', type: 'meeting',
        startDate: '', startTime: '09:00', endDate: '', endTime: '10:00',
        location: '', allDay: false, color: '#6366f1',
    });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    const fetchEvents = useCallback(async () => {
        const start = new Date(year, month, 1).toISOString();
        const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
        try {
            const res = await fetch(`/api/calendar?startDate=${start}&endDate=${end}`);
            if (res.ok) {
                const data = await res.json();
                setEvents(data.items || []);
            }
        } catch { /* fallback */ }
    }, [year, month]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const createEvent = async () => {
        const startAt = form.allDay
            ? new Date(form.startDate + 'T00:00:00')
            : new Date(form.startDate + 'T' + form.startTime);
        const endAt = form.allDay
            ? new Date((form.endDate || form.startDate) + 'T23:59:59')
            : new Date((form.endDate || form.startDate) + 'T' + form.endTime);

        await fetch('/api/calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: form.title || form.titleAr,
                titleAr: form.titleAr,
                description: form.description,
                type: form.type,
                startAt: startAt.toISOString(),
                endAt: endAt.toISOString(),
                allDay: form.allDay,
                location: form.location,
                color: form.color,
            }),
        });
        setShowCreateModal(false);
        setForm({ title: '', titleAr: '', description: '', type: 'meeting', startDate: '', startTime: '09:00', endDate: '', endTime: '10:00', location: '', allDay: false, color: '#6366f1' });
        fetchEvents();
    };

    const deleteEvent = async (id: string) => {
        await fetch(`/api/calendar/${id}`, { method: 'DELETE' });
        setShowEventModal(null);
        fetchEvents();
    };

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => setCurrentDate(new Date());

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);

    const getEventsForDay = (day: number) => {
        return events.filter(e => {
            const d = new Date(e.startAt);
            return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
        });
    };

    const isToday = (day: number) =>
        today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

    // Build calendar grid cells
    const calendarCells: { day: number; currentMonth: boolean }[] = [];
    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
        calendarCells.push({ day: prevMonthDays - i, currentMonth: false });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        calendarCells.push({ day: d, currentMonth: true });
    }
    // Next month leading days
    const remaining = 42 - calendarCells.length;
    for (let d = 1; d <= remaining; d++) {
        calendarCells.push({ day: d, currentMonth: false });
    }

    // Upcoming events (next 7 days)
    const upcoming = events
        .filter(e => new Date(e.startAt) >= today)
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
        .slice(0, 6);

    return (
        <div style={{ minHeight: '100vh', background: bg, color: '#fff', padding: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>📅 التقويم</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>جدولة الاجتماعات والمواعيد والمهام</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 2, ...glass, padding: 4 }}>
                        {(['month', 'week', 'day'] as const).map(v => (
                            <button key={v} onClick={() => setView(v)} style={{
                                padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12,
                                background: view === v ? 'rgba(99,102,241,0.2)' : 'transparent',
                                color: view === v ? '#818cf8' : 'rgba(255,255,255,0.4)',
                            }}>
                                {v === 'month' ? 'شهري' : v === 'week' ? 'أسبوعي' : 'يومي'}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => { setShowCreateModal(true); setForm(f => ({ ...f, startDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay || today.getDate()).padStart(2, '0')}` })); }} style={{ ...glass, padding: '8px 18px', color: '#22c55e', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                        + حدث جديد
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
                {/* Main Calendar */}
                <div style={{ ...glass, padding: 20 }}>
                    {/* Month Navigation */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>→</button>
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: 20, fontWeight: 800 }}>{MONTHS_AR[month]} {year}</span>
                        </div>
                        <button onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>←</button>
                    </div>

                    <button onClick={goToday} style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: 'none', padding: '4px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, marginBottom: 12 }}>اليوم</button>

                    {/* Day headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                        {DAYS_AR.map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)', padding: '8px 0', fontWeight: 600 }}>{d}</div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                        {calendarCells.map((cell, i) => {
                            const dayEvents = cell.currentMonth ? getEventsForDay(cell.day) : [];
                            const todayHighlight = cell.currentMonth && isToday(cell.day);
                            const selected = cell.currentMonth && selectedDay === cell.day;
                            return (
                                <div key={i} onClick={() => cell.currentMonth && setSelectedDay(cell.day)} style={{
                                    minHeight: 80, padding: 6, borderRadius: 10, cursor: cell.currentMonth ? 'pointer' : 'default',
                                    background: todayHighlight ? 'rgba(99,102,241,0.15)' : selected ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                                    border: todayHighlight ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                                    opacity: cell.currentMonth ? 1 : 0.3, transition: 'all 0.15s',
                                }}>
                                    <div style={{ fontSize: 12, fontWeight: todayHighlight ? 800 : 500, color: todayHighlight ? '#818cf8' : 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
                                        {cell.day}
                                    </div>
                                    {dayEvents.slice(0, 3).map((evt, j) => {
                                        const typeInfo = EVENT_TYPES.find(t => t.value === evt.type);
                                        return (
                                            <div key={j} onClick={e => { e.stopPropagation(); setShowEventModal(evt); }} style={{
                                                fontSize: 10, padding: '2px 4px', borderRadius: 4, marginBottom: 2,
                                                background: `${evt.color || typeInfo?.color || '#6366f1'}22`,
                                                color: evt.color || typeInfo?.color || '#6366f1',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer',
                                            }}>
                                                {evt.titleAr || evt.title}
                                            </div>
                                        );
                                    })}
                                    {dayEvents.length > 3 && (
                                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>+{dayEvents.length - 3}</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Selected Day Events */}
                    {selectedDay && (
                        <div style={{ ...glass, padding: 16 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{selectedDay} {MONTHS_AR[month]}</h3>
                            {getEventsForDay(selectedDay).length === 0 ? (
                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>لا توجد أحداث</p>
                            ) : (
                                getEventsForDay(selectedDay).map((evt: any, i: number) => {
                                    const typeInfo = EVENT_TYPES.find(t => t.value === evt.type);
                                    return (
                                        <div key={i} onClick={() => setShowEventModal(evt)} style={{
                                            padding: '8px 10px', borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                                            background: `${evt.color || typeInfo?.color || '#6366f1'}11`,
                                            borderRight: `3px solid ${evt.color || typeInfo?.color || '#6366f1'}`,
                                        }}>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>{typeInfo?.icon} {evt.titleAr || evt.title}</div>
                                            {!evt.allDay && (
                                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                                                    {new Date(evt.startAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                                                    {evt.endAt && ` - ${new Date(evt.endAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}`}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Upcoming Events */}
                    <div style={{ ...glass, padding: 16 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📌 الأحداث القادمة</h3>
                        {upcoming.length === 0 ? (
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>لا توجد أحداث قادمة</p>
                        ) : (
                            upcoming.map((evt: any, i: number) => {
                                const typeInfo = EVENT_TYPES.find(t => t.value === evt.type);
                                return (
                                    <div key={i} onClick={() => setShowEventModal(evt)} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                                        <div style={{ fontSize: 12, fontWeight: 600 }}>{typeInfo?.icon} {evt.titleAr || evt.title}</div>
                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                                            {new Date(evt.startAt).toLocaleDateString('ar', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            {!evt.allDay && ` • ${new Date(evt.startAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}`}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Event Type Legend */}
                    <div style={{ ...glass, padding: 16 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🎨 أنواع الأحداث</h3>
                        {EVENT_TYPES.map(t => (
                            <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color }} />
                                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{t.icon} {t.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Create Event Modal */}
            {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowCreateModal(false)}>
                    <div style={{ ...glass, padding: 28, width: 480, maxHeight: '85vh', overflowY: 'auto', background: 'rgba(15,15,26,0.95)' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>📅 حدث جديد</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>العنوان (عربي)</label>
                                    <input value={form.titleAr} onChange={e => setForm({ ...form, titleAr: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, marginTop: 4 }} placeholder="اجتماع مع العميل" />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Title (EN)</label>
                                    <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} dir="ltr" style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, marginTop: 4 }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>النوع</label>
                                    <select value={form.type} onChange={e => { const t = EVENT_TYPES.find(et => et.value === e.target.value); setForm({ ...form, type: e.target.value, color: t?.color || '#6366f1' }); }} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, marginTop: 4 }}>
                                        {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>المكان</label>
                                    <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, marginTop: 4 }} placeholder="المكتب / أونلاين" />
                                </div>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.allDay} onChange={e => setForm({ ...form, allDay: e.target.checked })} /> يوم كامل
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: form.allDay ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>تاريخ البداية</label>
                                    <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value, endDate: form.endDate || e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, marginTop: 4 }} />
                                </div>
                                {!form.allDay && (
                                    <div>
                                        <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>الوقت</label>
                                        <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, marginTop: 4 }} />
                                    </div>
                                )}
                                <div>
                                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>تاريخ النهاية</label>
                                    <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, marginTop: 4 }} />
                                </div>
                                {!form.allDay && (
                                    <div>
                                        <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>الوقت</label>
                                        <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, marginTop: 4 }} />
                                    </div>
                                )}
                            </div>
                            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>الوصف</label>
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, resize: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                            <button onClick={createEvent} style={{ flex: 1, padding: 12, borderRadius: 10, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>إنشاء الحدث</button>
                            <button onClick={() => setShowCreateModal(false)} style={{ padding: '12px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: 13 }}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Detail Modal */}
            {showEventModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowEventModal(null)}>
                    <div style={{ ...glass, padding: 28, width: 420, background: 'rgba(15,15,26,0.95)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                                {EVENT_TYPES.find(t => t.value === showEventModal.type)?.icon} {showEventModal.titleAr || showEventModal.title}
                            </h3>
                            <button onClick={() => setShowEventModal(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 18 }}>✕</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>📅</span>
                                <span>{new Date(showEventModal.startAt).toLocaleDateString('ar', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            {!showEventModal.allDay && (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>⏰</span>
                                    <span>
                                        {new Date(showEventModal.startAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                                        {showEventModal.endAt && ` — ${new Date(showEventModal.endAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}`}
                                    </span>
                                </div>
                            )}
                            {showEventModal.location && (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>📍</span>
                                    <span>{showEventModal.location}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>🏷️</span>
                                <span style={{ padding: '2px 10px', borderRadius: 8, fontSize: 11, background: `${showEventModal.color || '#6366f1'}22`, color: showEventModal.color || '#6366f1' }}>
                                    {EVENT_TYPES.find(t => t.value === showEventModal.type)?.label || showEventModal.type}
                                </span>
                            </div>
                            {showEventModal.description && (
                                <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginTop: 4 }}>
                                    {showEventModal.description}
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                            <button onClick={() => deleteEvent(showEventModal.id)} style={{ flex: 1, padding: 10, borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: 13 }}>حذف</button>
                            <button onClick={() => setShowEventModal(null)} style={{ flex: 1, padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: 13 }}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
