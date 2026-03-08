"use client";

import { useState, useEffect, useTransition, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { getCreativeStore } from '@/lib/creativeStore';
import { texts } from '@/lib/texts';
import styles from "./page.module.css";


// ── localStorage Helpers ──
const STORAGE_KEY = 'remark_pm_marketing';

function loadPersistedState<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function persistState(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(value));
  } catch (e) { console.warn('localStorage save failed:', e); }
}

export default function Home() {
  const [expanded, setExpanded] = useState(false);
  const [showTaskList, setShowTaskList] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    clientName: '', industry: '', planType: '', budget: '',
    goals: [] as string[], platforms: [] as string[],
    targetAudience: '', contentTypes: [] as string[],
    postsPerWeek: '5', startDate: '', notes: '',
    socialLinks: [''] as string[], files: [] as File[],
    meetingBrief: '', nextMeetingDate: '', meetingAttendees: [] as string[],
    // custom options added by user
    customIndustry: [] as string[], customPlanType: [] as string[],
    customGoals: [] as string[], customPlatforms: [] as string[],
    customContent: [] as string[],
  });
  const [customInput, setCustomInput] = useState<Record<string, string>>({});
  const [showCustom, setShowCustom] = useState<Record<string, boolean>>({});
  // pipeline
  const [pipelineClients, setPipelineClients] = useState<{ name: string; stage: number; data: any; converted?: boolean; convertedClientId?: string }[]>([]);
  const [showAgreement, setShowAgreement] = useState(false);
  const [agreementIdx, setAgreementIdx] = useState(-1);
  const [isConverting, setIsConverting] = useState(false);
  const [agreementData, setAgreementData] = useState({ agreedBudget: '', accountMgr: '', contractDuration: '' });
  // Pipeline expanded actions
  const [pipelineExpanded, setPipelineExpanded] = useState<Record<number, string | null>>({});
  const [pipelineMeetingData, setPipelineMeetingData] = useState<Record<number, { date: string; attendees: string[] }>>({});
  const [pipelineNewPerson, setPipelineNewPerson] = useState<Record<number, string>>({});
  const [pipelineChatInput, setPipelineChatInput] = useState<Record<number, string>>({});
  const [pipelineChatMsgs, setPipelineChatMsgs] = useState<Record<number, any[]>>({});
  const [expandedPipelineIdx, setExpandedPipelineIdx] = useState<number | null>(null);
  const [pipelineStageData, setPipelineStageData] = useState<Record<number, Record<number, any>>>({});
  const [convertedClients, setConvertedClients] = useState<any[]>([]);
  const [activeStagePanel, setActiveStagePanel] = useState<Record<number, number | null>>({});
  const [expandedConvertedIdx, setExpandedConvertedIdx] = useState<number | null>(null);
  const [showConvertedTaskList, setShowConvertedTaskList] = useState<Record<number, boolean>>({});
  const [convertedChatInput, setConvertedChatInput] = useState<Record<number, string>>({});
  const [convertedChatMsgs, setConvertedChatMsgs] = useState<Record<number, any[]>>({});

  // Edit Plan state
  const [showEditPlanSelector, setShowEditPlanSelector] = useState(false);
  const [editingClientType, setEditingClientType] = useState<'warda' | 'converted' | null>(null);
  const [editingClientIdx, setEditingClientIdx] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Monthly Summary state
  const [showSummarySelector, setShowSummarySelector] = useState(false);
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);
  const [summaryClientType, setSummaryClientType] = useState<'warda' | 'converted' | null>(null);
  const [summaryClientIdx, setSummaryClientIdx] = useState<number | null>(null);
  const [summaryData, setSummaryData] = useState({
    month: '', year: '2026', postsPublished: '', engagement: '',
    followersGained: '', bestPost: '', highlights: '', challenges: '',
    recommendations: '', clientFeedback: '',
  });
  const [monthlySummaries, setMonthlySummaries] = useState<Record<string, any[]>>({});

  // ── Hydrate from localStorage AFTER mount (prevents SSR mismatch) ──
  const hydrated = useRef(false);
  useEffect(() => {
    setPipelineClients(loadPersistedState('pipelineClients', []));
    setPipelineChatMsgs(loadPersistedState('pipelineChatMsgs', {}));
    setPipelineStageData(loadPersistedState('pipelineStageData', {}));
    setConvertedClients(loadPersistedState('convertedClients', []));
    setConvertedChatMsgs(loadPersistedState('convertedChatMsgs', {}));
    setMonthlySummaries(loadPersistedState('monthlySummaries', {}));
    hydrated.current = true;
  }, []);

  // الوردة static data (for editing)
  const [wardaData, setWardaData] = useState({
    clientName: lang === 'ar' ? 'الوردة' : 'The Rose',
    industry: lang === 'ar' ? 'مطاعم ومقاهي' : 'Restaurants & Cafés',
    planType: lang === 'ar' ? 'شهرية' : 'Monthly',
    budget: '5,000',
    goals: lang === 'ar' ? ['زيادة الوعي بالعلامة', 'زيادة المبيعات', 'تحسين التفاعل'] : ['Brand Awareness', 'Increase Sales', 'Improve Engagement'],
    platforms: ['Instagram', 'TikTok', 'Snapchat'],
    targetAudience: lang === 'ar' ? 'شباب 18-35 سنة في بغداد' : 'Youth 18-35 in Baghdad',
    contentTypes: lang === 'ar' ? ['تصاميم سوشيال', 'فيديو ريلز', 'تصوير منتجات', 'حملات إعلانية'] : ['Social Designs', 'Reels Video', 'Product Photography', 'Ad Campaigns'],
    postsPerWeek: '5',
    startDate: '2026-03-01',
    notes: '',
    socialLinks: ['https://instagram.com/alwarda'] as string[],
    files: [] as File[],
    meetingBrief: '',
    nextMeetingDate: '',
    meetingAttendees: [] as string[],
    customIndustry: [] as string[], customPlanType: [] as string[],
    customGoals: [] as string[], customPlatforms: [] as string[],
    customContent: [] as string[],
  });

  // ── Persist key state to localStorage (guarded: skip until hydration is done) ──
  // Guard: never overwrite saved data with empty array on crash/reload race
  useEffect(() => {
    if (!hydrated.current) return;
    if (pipelineClients.length === 0) {
      const saved = loadPersistedState<any[]>('pipelineClients', []);
      if (saved.length > 0) return;
    }
    persistState('pipelineClients', pipelineClients);
  }, [pipelineClients]);
  useEffect(() => {
    if (!hydrated.current) return;
    if (convertedClients.length === 0) {
      const saved = loadPersistedState<any[]>('convertedClients', []);
      if (saved.length > 0) return;
    }
    persistState('convertedClients', convertedClients);
  }, [convertedClients]);
  useEffect(() => { if (hydrated.current) persistState('pipelineStageData', pipelineStageData); }, [pipelineStageData]);
  useEffect(() => { if (hydrated.current) persistState('convertedChatMsgs', convertedChatMsgs); }, [convertedChatMsgs]);
  useEffect(() => { if (hydrated.current) persistState('monthlySummaries', monthlySummaries); }, [monthlySummaries]);
  useEffect(() => { if (hydrated.current) persistState('pipelineChatMsgs', pipelineChatMsgs); }, [pipelineChatMsgs]);
  useEffect(() => { if (hydrated.current) persistState('wardaData', wardaData); }, [wardaData]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  useEffect(() => {
    setChatMessages([
      { sender: texts[lang].remarkAssistant, text: texts[lang].assistantMsg1, time: "10:30", avatar: "🤖", type: "ai" },
      { sender: texts[lang].marketingManager, text: texts[lang].managerMsg, time: "10:45", avatar: "M", type: "mktg" },
      { sender: texts[lang].accountManager, text: texts[lang].accountManagerMsg, time: "11:02", avatar: "A", type: "acct" },
      { sender: texts[lang].remarkAssistant, text: texts[lang].assistantMsg2, time: "11:05", avatar: "🤖", type: "ai" }
    ]);
  }, [lang]);

  const generateAIReply = useCallback((userMsg: string, langKey: 'ar' | 'en') => {
    const lower = userMsg.toLowerCase();
    const replies = langKey === 'ar' ? {
      budget: '💰 بخصوص الميزانية — أنصحك بمراجعة أداء الحملات السابقة أولاً لتحديد التخصيص الأمثل. هل تحتاج تقرير مقارنة؟',
      content: '📝 لإنشاء محتوى فعّال، ركّز على القصص البصرية والـ Reels القصيرة. جمهورك يتفاعل أكثر مع المحتوى الأصلي.',
      report: '📊 يمكنني تجهيز تقرير شامل يشمل: نسبة التفاعل، الوصول، أفضل المنشورات. حدد الفترة الزمنية.',
      schedule: '📅 أنصح بالنشر 5 مرات أسبوعياً: 3 بوستات + 2 ستوريز. أفضل أوقات النشر لجمهورك: 8-10 مساءً.',
      default: '👍 تم الملاحظة! سأعمل على ذلك وأحدّثك بالنتائج قريباً. هل تحتاج شيء إضافي؟',
    } : {
      budget: '💰 Regarding budget — I recommend reviewing past campaign performance first. Want a comparison report?',
      content: '📝 For effective content, focus on visual storytelling and short Reels. Your audience engages more with original content.',
      report: '📊 I can prepare a comprehensive report including: engagement rate, reach, top posts. Specify the time period.',
      schedule: '📅 I recommend posting 5 times weekly: 3 posts + 2 stories. Best posting times for your audience: 8-10 PM.',
      default: '👍 Noted! I\'ll work on that and update you soon. Anything else you need?',
    };
    if (lower.includes('ميزانية') || lower.includes('budget') || lower.includes('مبلغ')) return replies.budget;
    if (lower.includes('محتوى') || lower.includes('content') || lower.includes('بوست') || lower.includes('post')) return replies.content;
    if (lower.includes('تقرير') || lower.includes('report') || lower.includes('إحصائيات') || lower.includes('stats')) return replies.report;
    if (lower.includes('جدول') || lower.includes('schedule') || lower.includes('نشر') || lower.includes('posting')) return replies.schedule;
    return replies.default;
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userText = chatInput;

    setChatMessages(prev => [...prev, {
      sender: texts[lang].marketingManager,
      text: userText,
      time: timeString,
      avatar: "M",
      type: "mktg"
    }]);
    setChatInput("");

    // AI auto-reply after 1 second
    setTimeout(() => {
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setChatMessages(prev => [...prev, {
        sender: texts[lang].remarkAssistant,
        text: generateAIReply(userText, lang),
        time: replyTime,
        avatar: "🤖",
        type: "ai"
      }]);
    }, 1000);
  };

  const t = texts[lang];

  const toggleArrayItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  // Generate calendar tasks from marketing plan data
  const generateCalendarFromPlan = (data: any) => {
    const tasks: { week: number; task: string; platform: string; day: string }[] = [];
    const contentTypes = data.contentTypes || [];
    const platforms = data.platforms || [];
    const postsPerWeek = parseInt(data.postsPerWeek) || 3;
    const days = lang === 'ar'
      ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

    for (let week = 1; week <= 4; week++) {
      for (let i = 0; i < postsPerWeek && i < 5; i++) {
        const content = contentTypes[i % contentTypes.length] || (lang === 'ar' ? 'محتوى' : 'Content');
        const platform = platforms[i % platforms.length] || (lang === 'ar' ? 'عام' : 'General');
        tasks.push({ week, task: content, platform, day: days[i % days.length] });
      }
    }
    return tasks;
  };

  const [isPending, startTransition] = useTransition();
  const convertingRef = useRef(false);

  const handleConvertToClient = (idx: number) => {
    try {
      if (isConverting || convertingRef.current) return;
      convertingRef.current = true;
      setIsConverting(true);

      const pc = pipelineClients[idx];
      if (!pc) { setIsConverting(false); convertingRef.current = false; return; }

      // ── Compute everything synchronously (fast, no DOM) ──
      const stageInfo = pipelineStageData[idx] || {};
      const calendarTasks = generateCalendarFromPlan(pc.data);
      const calLines = calendarTasks.map(ct => `  📌 ${t.calWeek} ${ct.week} - ${ct.day}: ${ct.task} (${ct.platform})`).join('\n');
      const convMsg = t.conversionMsg.replace('{name}', pc.name || 'New Client');
      const taskItems = calendarTasks.slice(0, 8).map(ct => ({ text: `${t.calWeek} ${ct.week} - ${ct.day}: ${ct.task} (${ct.platform})`, status: 'pending' as const }));
      const stableClientId = `client_${(pc.name || 'new').replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
      const savedBudget = agreementData.agreedBudget;
      const savedContentTypes = pc.data?.contentTypes ? [...pc.data.contentTypes] : [];
      const pcName = pc.name || 'New Client';
      const pcData = { ...pc.data };
      const newClient = { name: pcName, data: { ...pcData, ...agreementData, stageHistory: stageInfo }, calendar: calendarTasks, tasks: taskItems, convertedAt: new Date().toISOString(), aiMessage: `${convMsg}\n\n${t.calendarGenerated}\n${calLines}`, linkedClientId: stableClientId };
      const newIdx = convertedClients.length;

      // ── SAFETY: Save to localStorage IMMEDIATELY before any async work ──
      const safePipeline = [...pipelineClients];
      safePipeline[idx] = { ...safePipeline[idx], converted: true, convertedClientId: stableClientId };
      persistState('pipelineClients', safePipeline);
      persistState('convertedClients', [...convertedClients, newClient]);

      // ── Phase 1: Close modal IMMEDIATELY ──
      setShowAgreement(false);
      setAgreementData({ agreedBudget: '', accountMgr: '', contractDuration: '' });

      // ── Phase 2 (150ms): Hide pipeline card ──
      setTimeout(() => {
        try {
          const updated = [...pipelineClients];
          updated[idx] = { ...updated[idx], converted: true, convertedClientId: stableClientId };
          setPipelineClients(updated);
          setExpandedPipelineIdx(null);
        } catch (e) { console.error('Phase 2 error:', e); }
      }, 150);

      // ── Phase 3 (350ms): Add converted client (low priority) ──
      setTimeout(() => {
        try {
          startTransition(() => {
            setConvertedClients(prev => [...prev, newClient]);
            setConvertedChatMsgs(prev => ({ ...prev, [newIdx]: [{ sender: t.remarkAssistant, avatar: '🤖', text: `${convMsg}\n\n${t.calendarGenerated}\n${calLines}`, time: 'AI', type: 'ai' }] }));
          });
        } catch (e) { console.error('Phase 3 error:', e); }
      }, 350);

      // ── Phase 4 (500ms): Expand + scroll + reset ──
      setTimeout(() => {
        try {
          setExpandedConvertedIdx(newIdx);
          setExpanded(false);
          setIsConverting(false);
          convertingRef.current = false;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) { console.error('Phase 4 error:', e); }
      }, 500);

      // ── Phase 5 (800ms): Creative store sync (background, batched) ──
      setTimeout(() => {
        try {
          const creativeStore = getCreativeStore();
          try {
            creativeStore.batchStart();
            creativeStore.syncClient({ clientId: stableClientId, name: pcName, nameEn: pcName, sector: pcData.industry || '', sectorEn: pcData.industry || '', planType: pcData.planType || '', budget: pcData.budget || savedBudget || '', socialLinks: pcData.socialLinks || [], avatar: '✅', createdAt: new Date().toISOString().split('T')[0], linkedFromMarketing: true, marketingConvertedAt: new Date().toISOString(), marketingTaskCount: savedContentTypes.length, marketingTaskTitles: savedContentTypes });
            for (const ct of savedContentTypes) {
              creativeStore.createRequestFromMarketingTask(stableClientId, ct, `mkt_auto_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`);
            }
          } catch (e: any) { console.error('Creative store sync error:', e); } finally {
            try { creativeStore.batchEnd(); } catch (e) { console.error('batchEnd error:', e); }
          }
        } catch (e) { console.error('Phase 5 error:', e); }
      }, 800);
    } catch (e) {
      console.error('handleConvertToClient error:', e);
      setIsConverting(false);
      convertingRef.current = false;
    }
  };

  // Helper to update stage data for a pipeline client
  const updateStageData = (clientIdx: number, stageIdx: number, field: string, value: any) => {
    setPipelineStageData(prev => ({
      ...prev,
      [clientIdx]: {
        ...(prev[clientIdx] || {}),
        [stageIdx]: {
          ...((prev[clientIdx] || {})[stageIdx] || {}),
          [field]: value
        }
      }
    }));
  };

  const getStageData = (clientIdx: number, stageIdx: number) => {
    return (pipelineStageData[clientIdx] || {})[stageIdx] || {};
  };

  return (
    <div className={styles.board} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* ==================== HEADER ==================== */}
      <header className={styles.header}>
        <div className={styles.headerRight}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>R</div>
            <span className={styles.logoText}>Remark</span>
          </div>
          <div className={styles.boardTitle}>
            <div className={styles.boardDot} />
            <h1 className={styles.boardName}>{t.marketingTeam}</h1>
          </div>
        </div>
        <div className={styles.headerLeft}>
          <div className={styles.accessGroup}>
            <div className={styles.avatarStack}>
              <div className={`${styles.stackedAvatar} ${styles.avatarCeo}`} title={t.ceo}>ص</div>
              <div className={`${styles.stackedAvatar} ${styles.avatarCoo}`} title={t.coo}>ف</div>
              <div className={`${styles.stackedAvatar} ${styles.avatarMktg}`} title={t.marketingManager}>م</div>
            </div>
            <button className={styles.addViewerBtn} title={t.addViewer}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5.5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
              <span>{t.addViewer}</span>
            </button>
          </div>
          <div className={styles.headerDivider} />
          <button className={styles.iconBtn} title={t.themeToggle} onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          </button>
          <button className={styles.iconBtn} title={t.langToggle} onClick={() => setLang(prev => prev === 'ar' ? 'en' : 'ar')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          </button>
          <div className={styles.userAvatar}>م.خ</div>
          <div className={styles.headerDivider} />
          {/* Board Switcher */}
          <div className={styles.navSwitcher}>
            <span className={styles.navActive}>{lang === 'ar' ? '📋 التسويق' : '📋 Marketing'}</span>
            <Link href="/creative" className={styles.navInactive}>{lang === 'ar' ? '🎨 الإبداعي' : '🎨 Creative'}</Link>
            <Link href="/production" className={styles.navInactive}>{lang === 'ar' ? '🎬 الإنتاج' : '🎬 Production'}</Link>
            <Link href="/publishing" className={styles.navInactive}>{lang === 'ar' ? '📢 النشر' : '📢 Publishing'}</Link>
          </div>
        </div>
      </header>

      {/* ==================== CONTENT ==================== */}
      <main className={styles.content}>

        {/* ==================== ACTION CARDS ==================== */}
        <div className={styles.actionCards}>
          <div className={`${styles.actionCard} ${styles.actionCardBlue}`} onClick={() => { setIsEditMode(false); setWizardData({ clientName: '', industry: '', planType: '', budget: '', goals: [], platforms: [], targetAudience: '', contentTypes: [], postsPerWeek: '5', startDate: '', notes: '', socialLinks: [''], files: [], meetingBrief: '', nextMeetingDate: '', meetingAttendees: [], customIndustry: [], customPlanType: [], customGoals: [], customPlatforms: [], customContent: [] }); setShowWizard(true); setWizardStep(1); }}>
            <div>
              <div className={`${styles.actionIcon} ${styles.actionIconBlue}`}>📋</div>
              <div className={styles.actionTitle}>{t.buildPlan}</div>
              <div className={styles.actionDesc}>{t.buildPlanDesc}</div>
            </div>
            <div className={styles.actionArrow}>→</div>
          </div>
          <div className={`${styles.actionCard} ${styles.actionCardPurple}`} onClick={() => setShowEditPlanSelector(true)}>
            <div>
              <div className={`${styles.actionIcon} ${styles.actionIconPurple}`}>✏️</div>
              <div className={styles.actionTitle}>{t.editPlan}</div>
              <div className={styles.actionDesc}>{t.editPlanDesc}</div>
            </div>
            <div className={styles.actionArrow}>→</div>
          </div>
          <div className={`${styles.actionCard} ${styles.actionCardCyan}`} onClick={() => setShowSummarySelector(true)}>
            <div>
              <div className={`${styles.actionIcon} ${styles.actionIconCyan}`}>📊</div>
              <div className={styles.actionTitle}>{t.monthlyUpdate}</div>
              <div className={styles.actionDesc}>{t.monthlyUpdateDesc}</div>
            </div>
            <div className={styles.actionArrow}>→</div>
          </div>
        </div>

        {/* ==================== PIPELINE: POTENTIAL CLIENT ==================== */}
        {
          pipelineClients.length > 0 && (
            <div className={styles.pipelineSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>{t.potentialClient}</span>
                <div className={styles.sectionLine} />
                <span className={styles.sectionCount}>{pipelineClients.filter(pc => !pc.converted).length}</span>
              </div>
              {pipelineClients.map((pc, idx) => pc.converted ? null : (
                <div key={idx}>
                  {/* ===== COLLAPSED Pipeline Card ===== */}
                  {expandedPipelineIdx !== idx && (
                    <div className={`${styles.clientCardSmall} ${styles.horizontalCard} ${styles.pipelineCardSmall}`} onClick={() => setExpandedPipelineIdx(idx)} style={pc.converted ? { borderColor: 'rgba(34,197,94,.3)', background: 'rgba(34,197,94,.03)' } : undefined}>
                      <div className={styles.horizontalCardContent}>
                        <div className={styles.horizontalCardRight}>
                          <div className={styles.smallAvatar}>{pc.converted ? '✅' : '🎯'}</div>
                          <div className={styles.smallNameBox}>
                            <div className={styles.smallName}>{pc.name} {pc.converted && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600, marginRight: 6 }}>✅ {lang === 'ar' ? 'تم التحويل' : 'Converted'}</span>}</div>
                            <div className={styles.smallSubtitle}>{pc.data.industry} • {pc.data.planType} {pc.converted && pc.convertedClientId && <Link href={`/creative/client/${pc.convertedClientId}`} onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: '#14b8a6', fontWeight: 600, marginRight: 6, textDecoration: 'none' }}>🎨 {lang === 'ar' ? 'فتح الإبداعي' : 'Open Creative'}</Link>}</div>
                          </div>
                        </div>
                        <div className={styles.horizontalCardCenter}>
                          <div className={styles.smallBadges}>
                            <div className={styles.smallBadge}>
                              <span>{t.pipelineStages[pc.stage]}</span>
                            </div>
                            <div className={styles.pipelineBudgetBadge}>{pc.data.budget || '—'}</div>
                          </div>
                        </div>
                        <div className={styles.horizontalCardLeft}>
                          <div className={`${styles.smallBadge} ${styles.smallBadgeChat}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                          </div>
                        </div>
                      </div>
                      <div className={styles.horizontalProgressContainer}>
                        <div className={styles.smallProgress}>
                          <div className={styles.smallProgressFill} style={{ width: `${((pc.stage + 1) / 5) * 100}%`, background: 'var(--accent-gradient)' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===== EXPANDED Pipeline Card ===== */}
                  {
                    expandedPipelineIdx === idx && (
                      <div className={`${styles.clientCard} ${styles.clientCardExpanded}`}>
                        {/* Header */}
                        <div className={styles.clientHeader}>
                          <div className={styles.clientInfo}>
                            <div className={styles.clientAvatar}>🎯</div>
                            <div>
                              <div className={styles.clientName}>{pc.name}</div>
                              <div className={styles.clientType}>{pc.data.industry} • {pc.data.planType}</div>
                            </div>
                            <div className={styles.clientDivider} />
                            <div className={styles.pipelineBudgetBadge}>{pc.data.budget || '—'}</div>
                          </div>
                          <div className={styles.clientActions}>
                            <button className={styles.clientBtnIcon} title={t.pEditPlan} onClick={() => { setWizardData(pc.data); setShowWizard(true); setWizardStep(1); }}>
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                            </button>
                            <button className={styles.clientBtnIcon} title={t.pExportPlan} onClick={() => setPipelineExpanded({ ...pipelineExpanded, [idx]: pipelineExpanded[idx] === 'export' ? null : 'export' })}>
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            </button>
                            <button className={styles.clientBtnClose} onClick={() => setExpandedPipelineIdx(null)} title={t.wClose}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>

                        {/* Export dropdown if open */}
                        {pipelineExpanded[idx] === 'export' && (
                          <div className={styles.pipelineExpandedPanel}>
                            <div className={styles.exportGrid}>
                              <button className={styles.exportOption} onClick={() => {
                                const data = JSON.stringify(pc.data, null, 2);
                                const blob = new Blob([data], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a'); a.href = url; a.download = `${pc.name}_plan.json`; a.click();
                              }}>
                                <span className={styles.exportIcon}>📄</span>
                                <span>{t.pExportJSON}</span>
                              </button>
                              <button className={styles.exportOption} onClick={() => {
                                const stageNames = t.pipelineStages;
                                const stageProgress = Math.round(((pc.stage + 1) / 5) * 100);
                                const w = window.open('', '_blank');
                                if (w) {
                                  w.document.write(`<html dir="rtl"><head><title>${pc.name} — خطة تسويقية</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Tahoma,sans-serif;padding:0;direction:rtl;background:#fff;color:#1e293b}
  .header{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:40px;border-radius:0 0 20px 20px}
  .header h1{font-size:28px;margin-bottom:8px} .header p{opacity:0.85;font-size:14px}
  .content{padding:30px 40px}
  .section{margin-bottom:28px}
  .section h2{font-size:18px;color:#6366f1;border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-bottom:14px}
  table{width:100%;border-collapse:collapse;margin:10px 0}
  td,th{border:1px solid #e2e8f0;padding:12px 16px;text-align:right;font-size:14px}
  th{background:#f8fafc;color:#475569;font-weight:600;width:30%}
  td{color:#1e293b}
  .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
  .chip{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:20px;padding:4px 14px;font-size:13px;color:#475569}
  .progress-track{width:100%;height:12px;background:#e2e8f0;border-radius:6px;margin:10px 0}
  .progress-fill{height:100%;background:linear-gradient(90deg,#6366f1,#22c55e);border-radius:6px;transition:width 0.3s}
  .stages{display:flex;justify-content:space-between;margin-top:6px}
  .stage-item{text-align:center;font-size:11px;color:#94a3b8}
  .stage-item.active{color:#6366f1;font-weight:700}
  .footer{text-align:center;padding:20px;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;margin-top:30px}
  @media print{.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="header"><h1>🎯 ${pc.name}</h1><p>تقرير الخطة التسويقية — ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
<div class="content">
  <div class="section"><h2>📋 معلومات العميل</h2>
    <table><tr><th>القطاع</th><td>${pc.data.industry || '—'}</td></tr>
    <tr><th>نوع الخطة</th><td>${pc.data.planType || '—'}</td></tr>
    <tr><th>الميزانية</th><td>${pc.data.budget || '—'}</td></tr>
    <tr><th>الجمهور المستهدف</th><td>${pc.data.targetAudience || '—'}</td></tr>
    <tr><th>عدد المنشورات/أسبوع</th><td>${pc.data.postsPerWeek || '—'}</td></tr></table>
  </div>
  <div class="section"><h2>📊 تقدم الخطة (${stageProgress}%)</h2>
    <div class="progress-track"><div class="progress-fill" style="width:${stageProgress}%"></div></div>
    <div class="stages">${stageNames.map((s: string, i: number) => `<div class="stage-item ${i <= pc.stage ? 'active' : ''}">${i + 1}. ${s}</div>`).join('')}</div>
  </div>
  <div class="section"><h2>🎯 الأهداف</h2><div class="chips">${(pc.data.goals || []).map((g: string) => `<span class="chip">${g}</span>`).join('') || '<span style="color:#94a3b8">لم يتم تحديدها</span>'}</div></div>
  <div class="section"><h2>📱 المنصات</h2><div class="chips">${(pc.data.platforms || []).map((p: string) => `<span class="chip">${p}</span>`).join('') || '<span style="color:#94a3b8">لم يتم تحديدها</span>'}</div></div>
  <div class="section"><h2>📝 أنواع المحتوى</h2><div class="chips">${(pc.data.contentTypes || []).map((c: string) => `<span class="chip">${c}</span>`).join('') || '<span style="color:#94a3b8">لم يتم تحديدها</span>'}</div></div>
  ${pc.data.meetingBrief ? `<div class="section"><h2>📄 ملخص الاجتماع</h2><p style="background:#f8fafc;padding:16px;border-radius:8px;line-height:1.8;font-size:14px">${pc.data.meetingBrief}</p></div>` : ''}
</div>
<div class="footer">تم الإنشاء بواسطة Remark PM — ${new Date().toLocaleDateString('ar-EG')}</div>
</body></html>`);
                                  w.document.close(); w.print();
                                }
                              }}>
                                <span className={styles.exportIcon}>📃</span>
                                <span>{t.pExportPDF}</span>
                              </button>
                              <button className={styles.exportOption} onClick={() => {
                                const planText = `Marketing Plan: ${pc.name}\nIndustry: ${pc.data.industry}\nPlan Type: ${pc.data.planType}\nBudget: ${pc.data.budget}\nGoals: ${(pc.data.goals || []).join(', ')}\nPlatforms: ${(pc.data.platforms || []).join(', ')}\nContent Types: ${(pc.data.contentTypes || []).join(', ')}\nTarget Audience: ${pc.data.targetAudience}\nPosts/Week: ${pc.data.postsPerWeek}\nMeeting Brief: ${pc.data.meetingBrief}`;
                                const encoded = encodeURIComponent(planText);
                                window.open(`https://notebooklm.google.com/?pli=1#source=${encoded}`, '_blank');
                              }}>
                                <span className={styles.exportIcon}>📓</span>
                                <span>{t.pExportNotebook}</span>
                              </button>
                              <button className={styles.exportOption} onClick={() => {
                                const text = `🎯 ${pc.name}\n📋 ${pc.data.industry} • ${pc.data.planType}\n💰 ${pc.data.budget}\n🎯 ${(pc.data.goals || []).join(', ')}\n📱 ${(pc.data.platforms || []).join(', ')}\n📝 ${(pc.data.contentTypes || []).join(', ')}`;
                                navigator.clipboard.writeText(text);
                              }}>
                                <span className={styles.exportIcon}>📎</span>
                                <span>{t.pExportClipboard}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Body: Pipeline Info + Chat */}
                        <div className={styles.clientBody}>
                          {/* ===== PIPELINE INFO (LEFT/START) ===== */}
                          <div className={styles.infographic}>
                            {/* Stages */}
                            <div className={styles.infoTitle}>{t.pipelineTitle}</div>
                            <div className={styles.pipelineStages}>
                              {t.pipelineStages.map((stage: string, si: number) => (
                                <div key={si} className={styles.pipelineStageItem}>
                                  <button
                                    className={`${styles.pipelineStageDot} ${si <= pc.stage ? styles.pipelineStageDotActive : ''}`}
                                    onClick={() => {
                                      if (si === 4) { setAgreementIdx(idx); setShowAgreement(true); }
                                      else if (si <= pc.stage || si === pc.stage + 1) {
                                        const updated = [...pipelineClients]; updated[idx] = { ...updated[idx], stage: si }; setPipelineClients(updated);
                                        setActiveStagePanel(prev => ({ ...prev, [idx]: prev[idx] === si ? null : si }));
                                      }
                                    }}
                                  >{si + 1}</button>
                                  <span className={`${styles.pipelineStageLabel} ${si <= pc.stage ? styles.pipelineStageLabelActive : ''}`}>{stage}</span>
                                  {si < 4 && <div className={`${styles.pipelineStageConnector} ${si < pc.stage ? styles.pipelineStageConnectorActive : ''}`} />}
                                </div>
                              ))}
                            </div>

                            {/* Stage 0: Initial Contact Panel */}
                            {activeStagePanel[idx] === 0 && (
                              <div className={styles.pipelineExpandedPanel}>
                                <div className={styles.wizardGrid}>
                                  <div className={styles.wizardField}>
                                    <label>{t.stageContactSource}</label>
                                    <select value={getStageData(idx, 0).source || ''} onChange={e => updateStageData(idx, 0, 'source', e.target.value)}>
                                      <option value="">{t.wSelectPlaceholder}</option>
                                      {t.stageContactSourceOpts.map((o: string) => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                  </div>
                                  <div className={styles.wizardField}>
                                    <label>{t.stageInterestLevel}</label>
                                    <div className={styles.wizardChips}>
                                      {t.stageInterestOpts.map((o: string) => (
                                        <button key={o} className={`${styles.wizardChip} ${getStageData(idx, 0).interest === o ? styles.wizardChipActive : ''}`}
                                          onClick={() => updateStageData(idx, 0, 'interest', o)}>{o}</button>
                                      ))}
                                    </div>
                                  </div>
                                  <div className={styles.wizardField + ' ' + styles.wizardFieldFull}>
                                    <label>{t.stageContactNotes}</label>
                                    <textarea rows={3} placeholder={t.stageContactNotesPH} value={getStageData(idx, 0).notes || ''}
                                      onChange={e => updateStageData(idx, 0, 'notes', e.target.value)} />
                                  </div>
                                </div>
                                <button className={styles.pipelineActionBtn} style={{ marginTop: 8 }} onClick={() => setActiveStagePanel(prev => ({ ...prev, [idx]: null }))}>{t.stageSaveNotes}</button>
                              </div>
                            )}

                            {/* Stage 1: First Meeting Panel */}
                            {activeStagePanel[idx] === 1 && (
                              <div className={styles.pipelineExpandedPanel}>
                                <div className={styles.wizardGrid}>
                                  <div className={styles.wizardField}>
                                    <label>{t.pMeetingDate}</label>
                                    <input type="datetime-local" value={getStageData(idx, 1).meetingDate || ''}
                                      onChange={e => updateStageData(idx, 1, 'meetingDate', e.target.value)} />
                                  </div>
                                  <div className={styles.wizardField}>
                                    <label>{t.pSelectAttendees}</label>
                                    <div className={styles.wizardChips}>
                                      {t.wTeamMembers.map((m: string) => (
                                        <button key={m} className={`${styles.wizardChip} ${(getStageData(idx, 1).attendees || []).includes(m) ? styles.wizardChipActive : ''}`}
                                          onClick={() => {
                                            const current = getStageData(idx, 1).attendees || [];
                                            const updated = current.includes(m) ? current.filter((a: string) => a !== m) : [...current, m];
                                            updateStageData(idx, 1, 'attendees', updated);
                                          }}>{m}</button>
                                      ))}
                                    </div>
                                    {(getStageData(idx, 1).attendees || []).length > 0 && (
                                      <div className={styles.reviewChips} style={{ marginTop: 6 }}>
                                        {(getStageData(idx, 1).attendees || []).map((a: string) => (
                                          <span key={a} className={styles.reviewChip} style={{ cursor: 'pointer' }} onClick={() => {
                                            const updated = (getStageData(idx, 1).attendees || []).filter((x: string) => x !== a);
                                            updateStageData(idx, 1, 'attendees', updated);
                                          }}>{a} ✕</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className={styles.wizardField + ' ' + styles.wizardFieldFull}>
                                    <label>{t.stageMeetingBrief}</label>
                                    <textarea rows={3} placeholder={t.stageMeetingBriefPH} value={getStageData(idx, 1).brief || ''}
                                      onChange={e => updateStageData(idx, 1, 'brief', e.target.value)} />
                                  </div>
                                </div>
                                <button className={styles.pipelineActionBtn} style={{ marginTop: 8 }} onClick={() => setActiveStagePanel(prev => ({ ...prev, [idx]: null }))}>{t.stageSaveNotes}</button>
                              </div>
                            )}

                            {/* Stage 2: Quotation Panel */}
                            {activeStagePanel[idx] === 2 && (
                              <div className={styles.pipelineExpandedPanel}>
                                <div className={styles.infoTitle} style={{ fontSize: 14, marginBottom: 8 }}>{t.stageQuoteTitle}</div>
                                <div className={styles.wizardGrid}>
                                  <div className={styles.wizardField}>
                                    <label>{t.stageQuoteAmount}</label>
                                    <input type="text" placeholder={t.stageQuoteAmountPH} value={getStageData(idx, 2).amount || ''}
                                      onChange={e => updateStageData(idx, 2, 'amount', e.target.value)} />
                                  </div>
                                  <div className={styles.wizardField}>
                                    <label>{t.stageQuoteServices}</label>
                                    <div className={styles.reviewChips}>
                                      {(pc.data.contentTypes || []).map((ct: string) => <span key={ct} className={styles.reviewChip}>{ct}</span>)}
                                      {(pc.data.platforms || []).map((p: string) => <span key={p} className={styles.reviewChip}>{p}</span>)}
                                    </div>
                                  </div>
                                  <div className={styles.wizardField + ' ' + styles.wizardFieldFull}>
                                    <label>{t.stageQuoteNotes}</label>
                                    <textarea rows={2} placeholder={t.stageQuoteNotesPH} value={getStageData(idx, 2).notes || ''}
                                      onChange={e => updateStageData(idx, 2, 'notes', e.target.value)} />
                                  </div>
                                </div>
                                <button className={styles.pipelineActionBtn} style={{ marginTop: 8 }} onClick={() => setActiveStagePanel(prev => ({ ...prev, [idx]: null }))}>{t.stageSendQuote}</button>
                              </div>
                            )}

                            {/* Stage 3: Negotiation Panel */}
                            {activeStagePanel[idx] === 3 && (
                              <div className={styles.pipelineExpandedPanel}>
                                <div className={styles.infoTitle} style={{ fontSize: 14, marginBottom: 8 }}>{t.stageNegTitle}</div>
                                <div className={styles.wizardGrid}>
                                  <div className={styles.wizardField}>
                                    <label>{t.stageNegCounterOffer}</label>
                                    <input type="text" placeholder={t.stageNegCounterOfferPH} value={getStageData(idx, 3).counterOffer || ''}
                                      onChange={e => updateStageData(idx, 3, 'counterOffer', e.target.value)} />
                                  </div>
                                  <div className={styles.wizardField}>
                                    <label>{t.stageNegStatus}</label>
                                    <select value={getStageData(idx, 3).status || ''} onChange={e => updateStageData(idx, 3, 'status', e.target.value)}>
                                      <option value="">{t.wSelectPlaceholder}</option>
                                      {t.stageNegStatusOpts.map((o: string) => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                  </div>
                                  <div className={styles.wizardField + ' ' + styles.wizardFieldFull}>
                                    <label>{t.stageNegOurResponse}</label>
                                    <textarea rows={2} placeholder={t.stageNegOurResponsePH} value={getStageData(idx, 3).ourResponse || ''}
                                      onChange={e => updateStageData(idx, 3, 'ourResponse', e.target.value)} />
                                  </div>
                                </div>
                                <button className={styles.pipelineActionBtn} style={{ marginTop: 8 }} onClick={() => setActiveStagePanel(prev => ({ ...prev, [idx]: null }))}>{t.stageSaveNotes}</button>
                              </div>
                            )}

                            {/* Quick Action Buttons */}
                            <div className={styles.pipelineActions} style={{ marginTop: 12 }}>
                              <button className={styles.pipelineActionBtn} onClick={() => setPipelineExpanded({ ...pipelineExpanded, [idx]: pipelineExpanded[idx] === 'addPerson' ? null : 'addPerson' })}>{t.pAddPerson}</button>
                            </div>

                            {/* Expanded: Add Person */}
                            {pipelineExpanded[idx] === 'addPerson' && (
                              <div className={styles.pipelineExpandedPanel}>
                                <div className={styles.customInputRow}>
                                  <input placeholder={t.wAddPersonPH} value={pipelineNewPerson[idx] || ''}
                                    onChange={e => setPipelineNewPerson({ ...pipelineNewPerson, [idx]: e.target.value })} />
                                  <button onClick={() => { if (pipelineNewPerson[idx]?.trim()) { const updated = [...pipelineClients]; const members = updated[idx].data.meetingAttendees || []; updated[idx] = { ...updated[idx], data: { ...updated[idx].data, meetingAttendees: [...members, pipelineNewPerson[idx].trim()] } }; setPipelineClients(updated); setPipelineNewPerson({ ...pipelineNewPerson, [idx]: '' }); } }}>✓</button>
                                </div>
                                {(pc.data.meetingAttendees?.length > 0) && (
                                  <div className={styles.reviewChips} style={{ marginTop: 8 }}>
                                    {pc.data.meetingAttendees.map((a: string) => <span key={a} className={styles.reviewChip}>{a}</span>)}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Plan Summary */}
                            <div className={styles.progressSection} style={{ marginTop: 16 }}>
                              <div className={styles.progressLabel}><span className={styles.progressLabelText}>{t.pipelineTitle}</span><span className={styles.progressLabelValue}>{Math.round(((pc.stage + 1) / 5) * 100)}%</span></div>
                              <div className={styles.progressTrack}><div className={`${styles.progressFill} ${styles.progressFillGreen}`} style={{ width: `${((pc.stage + 1) / 5) * 100}%` }} /></div>
                            </div>

                            {/* Quick Info */}
                            {(pc.data.goals?.length > 0 || pc.data.platforms?.length > 0) && (
                              <div className={styles.timeline} style={{ marginTop: 12 }}>
                                {(pc.data.goals || []).map((g: string) => (
                                  <div key={g} className={styles.timelineItem}><span className={`${styles.timelineDot} ${styles.dotGreen}`} /><span className={styles.timelineText}>{g}</span></div>
                                ))}
                                {(pc.data.platforms || []).map((p: string) => (
                                  <div key={p} className={styles.timelineItem}><span className={`${styles.timelineDot} ${styles.dotBlue}`} /><span className={styles.timelineText}>{p}</span></div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* ===== CHAT SECTION ===== */}
                          <div className={styles.chatSection}>
                            <div className={styles.chatHeader}>
                              <div className={styles.chatTitle}>{t.teamChat}</div>
                              <div className={styles.chatParticipants}>
                                <div className={`${styles.chatAvatar} ${styles.chatAvatarAi}`} title={t.remarkAssistant}>🤖</div>
                                <div className={`${styles.chatAvatar} ${styles.chatAvatarMktg}`} title={t.marketingManager}>M</div>
                              </div>
                            </div>
                            <div className={styles.chatMessages}>
                              <div className={styles.chatMsg}>
                                <div className={`${styles.chatMsgAvatar} ${styles.chatAvatarAi}`}>🤖</div>
                                <div className={styles.chatBubble}>
                                  <div className={styles.chatSender}>{t.remarkAssistant}</div>
                                  <div className={styles.chatText}>{lang === 'ar' ? `مرحباً! أنا مساعد ريمارك. كيف يمكنني مساعدتك في خطة ${pc.name}؟` : `Hi! I'm Remark Assistant. How can I help you with ${pc.name}'s plan?`}</div>
                                  <div className={styles.chatTime}>AI</div>
                                </div>
                              </div>
                              {(pipelineChatMsgs[idx] || []).map((msg: any, mi: number) => (
                                <div key={mi} className={styles.chatMsg}>
                                  <div className={`${styles.chatMsgAvatar} ${msg.type === 'ai' ? styles.chatAvatarAi : styles.chatAvatarMktg}`}>{msg.avatar}</div>
                                  <div className={styles.chatBubble}>
                                    <div className={styles.chatSender}>{msg.sender}</div>
                                    <div className={styles.chatText}>{msg.text}</div>
                                    <div className={styles.chatTime}>{msg.time}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <form className={styles.chatInput} onSubmit={e => {
                              e.preventDefault();
                              const text = pipelineChatInput[idx]?.trim();
                              if (!text) return;
                              const newMsg = { sender: t.marketingManager, avatar: 'M', text, time: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }), type: 'mktg' };
                              setPipelineChatMsgs(prev => ({ ...prev, [idx]: [...(prev[idx] || []), newMsg] }));
                              setPipelineChatInput(prev => ({ ...prev, [idx]: '' }));
                            }}>
                              <input type="text" value={pipelineChatInput[idx] || ''} onChange={e => setPipelineChatInput(prev => ({ ...prev, [idx]: e.target.value }))} className={styles.chatInputField} placeholder={t.typeMsg} />
                              <button type="submit" className={styles.chatSendBtn}>➤</button>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )
        }


        {/* ==================== SECTION: CLIENTS ==================== */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>🧑‍💼 {t.clients}</span>
          <div className={styles.sectionLine} />
          <span className={styles.sectionCount}>{convertedClients.length + 1} {t.clientCount}</span>
        </div>

        {/* ==================== CLIENT CARDS ==================== */}
        <div className={styles.clientCards}>

          {/* ===== CONVERTED CLIENTS — same as الوردة ===== */}
          {convertedClients.map((cc, ci) => (
            <div key={`cc-${ci}`}>
              {/* Collapsed — same as الوردة collapsed */}
              {expandedConvertedIdx !== ci && (
                <div className={`${styles.clientCardSmall} ${styles.horizontalCard}`} onClick={() => { setExpandedConvertedIdx(ci); setExpanded(false); }}>
                  <div className={styles.horizontalCardContent}>
                    <div className={styles.horizontalCardRight}>
                      <div className={styles.smallAvatar}>✅</div>
                      <div className={styles.smallNameBox}>
                        <div className={styles.smallName}>{cc.name}</div>
                        <div className={styles.smallSubtitle}>{cc.data.industry} • {cc.data.planType}</div>
                      </div>
                    </div>
                    <div className={styles.horizontalCardCenter}>
                      <div className={styles.smallBadges}>
                        <div className={styles.avatarStackSmall}>
                          <div className={`${styles.stackedAvatarSmall} ${styles.avatarAcct}`} title={cc.data.accountMgr}>{cc.data.accountMgr?.[0] || 'A'}</div>
                        </div>
                        <div className={styles.smallBadge} title={t.progress}>
                          <span>0%</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                        </div>
                        <div className={styles.smallBadge} title={t.activeTasks}>
                          <span>{(cc.tasks || cc.calendar || []).length} {t.activeTasks}</span>
                        </div>
                        <div className={`${styles.smallBadge} ${styles.smallBadgeWarn}`} title={t.lateTasks}>
                          <span>0 {t.lateTasks}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.horizontalCardLeft}>
                      <div className={`${styles.smallBadge} ${styles.smallBadgeChat}`} title={t.newMessages}>
                        <span className={styles.chatDot} />
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                      </div>
                    </div>
                  </div>
                  <div className={styles.horizontalProgressContainer}>
                    <div className={styles.smallProgress}>
                      <div className={styles.smallProgressFill} style={{ width: '0%' }} />
                    </div>
                  </div>
                  {cc.linkedClientId && (() => { try { const cs = getCreativeStore(); const cp = cs.getCreativeProgressForMarketing(cc.linkedClientId); if (cp.total > 0) return (<div style={{ display: 'flex', gap: 6, padding: '4px 12px 8px', flexWrap: 'wrap', alignItems: 'center' }}><span style={{ fontSize: 10, fontWeight: 600, color: '#8b5cf6', background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.15)', borderRadius: 12, padding: '2px 8px' }}>🎨 {lang === 'ar' ? `${cp.active} نشط` : `${cp.active} Active`}</span>{cp.done > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: '#22c55e', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.15)', borderRadius: 12, padding: '2px 8px' }}>✅ {cp.done}</span>}{cp.blocked > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: '#ef4444', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)', borderRadius: 12, padding: '2px 8px' }}>⛔ {cp.blocked}</span>}<Link href={`/creative/client/${cc.linkedClientId}`} onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: '#14b8a6', fontWeight: 600, textDecoration: 'none' }}>🎨→</Link></div>); return null; } catch { return null; } })()}
                </div>
              )}

              {/* Expanded — same as الوردة expanded */}
              {expandedConvertedIdx === ci && (
                <div className={`${styles.clientCard} ${styles.clientCardExpanded}`}>
                  {/* Header */}
                  <div className={styles.clientHeader}>
                    <div className={styles.clientInfo}>
                      <div className={styles.clientAvatar}>✅</div>
                      <div>
                        <div className={styles.clientName}>{cc.name}</div>
                        <div className={styles.clientType}>{cc.data.industry} • {cc.data.planType}</div>
                      </div>
                      <div className={styles.clientDivider} />
                      <div className={styles.avatarStack}>
                        <div className={`${styles.stackedAvatar} ${styles.avatarAcct}`} title={cc.data.accountMgr}>{cc.data.accountMgr?.[0] || 'A'}</div>
                      </div>
                    </div>
                    <div className={styles.clientActions}>
                      <button className={styles.clientBtnIcon} title={t.taskListHint} onClick={(e) => { e.stopPropagation(); setShowConvertedTaskList(prev => ({ ...prev, [ci]: !prev[ci] })); }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
                      </button>
                      <button className={`${styles.clientBtn} ${styles.btnNewTask}`}>
                        {t.newTask}
                      </button>
                      <button className={styles.clientBtnClose} onClick={(e) => { e.stopPropagation(); setExpandedConvertedIdx(null); }} title={t.minimize}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Task List Dropdown */}
                  {showConvertedTaskList[ci] && (
                    <div className={styles.taskListPanel}>
                      <div className={styles.taskListHeader}>
                        <span>{t.taskListTitle}</span>
                        <button onClick={() => setShowConvertedTaskList(prev => ({ ...prev, [ci]: false }))} className={styles.taskListClose}>✕</button>
                      </div>
                      <div className={styles.taskListItems}>
                        {(cc.tasks || []).map((task: any, ti: number) => (
                          <div key={ti} className={`${styles.taskItem} ${task.status === 'done' ? styles.taskDone : task.status === 'active' ? styles.taskActive : ''}`}>
                            <span className={task.status === 'done' ? styles.taskCheck : task.status === 'active' ? styles.taskDot : styles.taskEmpty}>
                              {task.status === 'done' ? '✓' : task.status === 'active' ? '●' : '○'}
                            </span>
                            {task.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Body: Infographic + Chat */}
                  <div className={styles.clientBody}>
                    {/* ===== INFOGRAPHIC ===== */}
                    <div className={styles.infographic}>
                      <div className={styles.infoTitle}>
                        {t.calendarGenerated}
                      </div>
                      <div className={styles.statsRow}>
                        <div className={styles.statBox}><div className={`${styles.statValue} ${styles.statGreen}`}>0</div><div className={styles.statLabel}>{t.completed}</div></div>
                        <div className={styles.statBox}><div className={`${styles.statValue} ${styles.statBlue}`}>{(cc.tasks || cc.calendar || []).length}</div><div className={styles.statLabel}>{t.inProgress}</div></div>
                        <div className={styles.statBox}><div className={`${styles.statValue} ${styles.statYellow}`}>0</div><div className={styles.statLabel}>{t.lateTasks}</div></div>
                        <div className={styles.statBox}><div className={`${styles.statValue} ${styles.statRed}`}>0</div><div className={styles.statLabel}>{t.canceled}</div></div>
                      </div>
                      <div className={styles.progressSection}>
                        <div className={styles.progressLabel}><span className={styles.progressLabelText}>{t.totalProgress}</span><span className={styles.progressLabelValue}>0%</span></div>
                        <div className={styles.progressTrack}><div className={`${styles.progressFill} ${styles.progressFillGreen}`} style={{ width: '0%' }} /></div>
                      </div>
                      <div className={styles.progressSection}>
                        <div className={styles.progressLabel}><span className={styles.progressLabelText}>{t.deadlineAdherence}</span><span className={styles.progressLabelValue}>100%</span></div>
                        <div className={styles.progressTrack}><div className={`${styles.progressFill} ${styles.progressFillYellow}`} style={{ width: '100%' }} /></div>
                      </div>
                      <div className={styles.timeline}>
                        {(cc.calendar || []).slice(0, 5).map((task: any, ti: number) => (
                          <div key={ti} className={styles.timelineItem}>
                            <span className={`${styles.timelineDot} ${styles.dotGray}`} />
                            <span className={styles.timelineText}>{t.calWeek} {task.week} - {task.day}: {task.task}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ===== CHAT SECTION ===== */}
                    <div className={styles.chatSection}>
                      <div className={styles.chatHeader}>
                        <div className={styles.chatTitle}>{t.teamChat}</div>
                        <div className={styles.chatParticipants}>
                          <div className={`${styles.chatAvatar} ${styles.chatAvatarAi}`} title={t.remarkAssistant}>🤖</div>
                          <div className={`${styles.chatAvatar} ${styles.chatAvatarAcct}`} title={cc.data.accountMgr}>{cc.data.accountMgr?.[0] || 'A'}</div>
                        </div>
                      </div>
                      <div className={styles.chatMessages}>
                        {(convertedChatMsgs[ci] || []).map((msg: any, mi: number) => (
                          <div key={mi} className={styles.chatMsg}>
                            <div className={`${styles.chatMsgAvatar} ${msg.type === 'ai' ? styles.chatAvatarAi : msg.type === 'acct' ? styles.chatAvatarAcct : styles.chatAvatarMktg}`}>{msg.avatar}</div>
                            <div className={styles.chatBubble}>
                              <div className={styles.chatSender}>{msg.sender}</div>
                              <div className={styles.chatText} style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                              <div className={styles.chatTime}>{msg.time}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <form className={styles.chatInput} onSubmit={e => {
                        e.preventDefault();
                        const text = convertedChatInput[ci]?.trim();
                        if (!text) return;
                        const newMsg = { sender: t.marketingManager, avatar: 'M', text, time: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }), type: 'mktg' };
                        setConvertedChatMsgs(prev => ({ ...prev, [ci]: [...(prev[ci] || []), newMsg] }));
                        setConvertedChatInput(prev => ({ ...prev, [ci]: '' }));
                      }}>
                        <input type="text" value={convertedChatInput[ci] || ''} onChange={e => setConvertedChatInput(prev => ({ ...prev, [ci]: e.target.value }))} className={styles.chatInputField} placeholder={t.typeMsg} />
                        <button type="submit" className={styles.chatSendBtn}>➤</button>
                      </form>
                    </div>
                  </div>

                  {/* ===== CALENDAR ===== */}
                  <div className={styles.calendarSection}>
                    <div className={styles.calendarHeader}>
                      <div className={styles.calendarTitle}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        <span>{t.calendarTitle}</span>
                      </div>
                    </div>
                    <div className={styles.calendarGrid}>
                      {/* Days header */}
                      <div className={styles.calDayHeader}>{t.sun}</div>
                      <div className={styles.calDayHeader}>{t.mon}</div>
                      <div className={styles.calDayHeader}>{t.tue}</div>
                      <div className={styles.calDayHeader}>{t.wed}</div>
                      <div className={styles.calDayHeader}>{t.thu}</div>
                      <div className={styles.calDayHeader}>{t.fri}</div>
                      <div className={styles.calDayHeader}>{t.sat}</div>
                      {/* Previous month fill */}
                      {[24, 25, 26, 27, 28].map(d => <div key={`p${d}`} className={`${styles.calDay} ${styles.calDayOther}`}>{d}</div>)}
                      {/* March 2026 */}
                      <div className={`${styles.calDay} ${styles.calDayWeekend}`}>1</div>
                      {[2, 3, 4, 5].map(d => {
                        const hasTask = (cc.calendar || []).some((ct: any) => ct.week === 1 && ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس'][d - 2] === ct.day);
                        return <div key={d} className={`${styles.calDay} ${hasTask ? styles.calDayTask : ''}`}><span>{d}</span>{hasTask && <span className={styles.calTaskDot} />}</div>;
                      })}
                      <div className={styles.calDay}>6</div>
                      <div className={`${styles.calDay} ${styles.calDayWeekend}`}>7</div>
                      <div className={`${styles.calDay} ${styles.calDayToday}`}><span>8</span><span className={styles.calTodayDot} /></div>
                      {[9, 10].map(d => <div key={d} className={`${styles.calDay} ${styles.calDayTask}`}><span>{d}</span><span className={styles.calTaskDot} /></div>)}
                      <div className={styles.calDay}>11</div>
                      <div className={styles.calDay}>12</div>
                      <div className={styles.calDay}>13</div>
                      <div className={`${styles.calDay} ${styles.calDayWeekend}`}>14</div>
                      {[15, 16, 17, 18, 19, 20].map(d => <div key={d} className={styles.calDay}>{d}</div>)}
                      <div className={`${styles.calDay} ${styles.calDayWeekend}`}>21</div>
                      {[22, 23, 24, 25, 26, 27].map(d => <div key={d} className={styles.calDay}>{d}</div>)}
                      <div className={`${styles.calDay} ${styles.calDayWeekend}`}>28</div>
                      {[29, 30, 31].map(d => <div key={d} className={styles.calDay}>{d}</div>)}
                    </div>
                  </div>

                </div>
              )}
            </div>
          ))}

          {/* ===== الوردة — COLLAPSED ===== */}
          {!expanded && (
            <div className={`${styles.clientCardSmall} ${styles.horizontalCard}`} onClick={() => setExpanded(true)}>
              <div className={styles.horizontalCardContent}>
                <div className={styles.horizontalCardRight}>
                  <div className={styles.smallAvatar}>🌹</div>
                  <div className={styles.smallNameBox}>
                    <div className={styles.smallName}>{t.clientName}</div>
                    <div className={styles.smallSubtitle}>{t.clientType}</div>
                  </div>
                </div>

                <div className={styles.horizontalCardCenter}>
                  <div className={styles.smallBadges}>
                    <div className={styles.avatarStackSmall}>
                      <div className={`${styles.stackedAvatarSmall} ${styles.avatarAcct}`} title={t.accountManager}>A</div>
                      <div className={`${styles.stackedAvatarSmall} ${styles.avatarDesigner}`} title={t.designer}>D</div>
                    </div>
                    <div className={styles.smallBadge} title={t.progress}>
                      <span>60%</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                    </div>
                    <div className={styles.smallBadge} title={t.activeTasks}>
                      <span>5 {t.activeTasks}</span>
                    </div>
                    <div className={`${styles.smallBadge} ${styles.smallBadgeWarn}`} title={t.lateTasks}>
                      <span>3 {t.lateTasks}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.horizontalCardLeft}>
                  {/* Chat Notification Indicator */}
                  <div className={`${styles.smallBadge} ${styles.smallBadgeChat}`} title={t.newMessages}>
                    <span className={styles.chatDot} />
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  </div>
                </div>
              </div>

              <div className={styles.horizontalProgressContainer}>
                <div className={styles.smallProgress}>
                  <div className={styles.smallProgressFill} style={{ width: '60%' }} />
                </div>
              </div>
            </div>
          )}

          {/* ===== الوردة — EXPANDED ===== */}
          {expanded && (
            <div className={`${styles.clientCard} ${styles.clientCardExpanded}`}>
              {/* Header */}
              <div className={styles.clientHeader}>
                <div className={styles.clientInfo}>
                  <div className={styles.clientAvatar}>🌹</div>
                  <div>
                    <div className={styles.clientName}>{t.clientName}</div>
                    <div className={styles.clientType}>{t.clientType}</div>
                  </div>
                  <div className={styles.clientDivider} />
                  <div className={styles.avatarStack}>
                    <div className={`${styles.stackedAvatar} ${styles.avatarAcct}`} title={t.accountManager}>A</div>
                    <div className={`${styles.stackedAvatar} ${styles.avatarDesigner}`} title={t.designer}>D</div>
                  </div>
                </div>
                <div className={styles.clientActions}>
                  <button className={styles.clientBtnIcon} title={t.taskListHint} onClick={(e) => { e.stopPropagation(); setShowTaskList(!showTaskList); }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
                  </button>
                  <button className={`${styles.clientBtn} ${styles.btnNewTask}`}>
                    {t.newTask}
                  </button>
                  <button className={styles.clientBtnClose} onClick={(e) => { e.stopPropagation(); setExpanded(false); }} title={t.minimize}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* Task List Dropdown */}
              {showTaskList && (
                <div className={styles.taskListPanel}>
                  <div className={styles.taskListHeader}>
                    <span>{t.taskListTitle}</span>
                    <button onClick={() => setShowTaskList(false)} className={styles.taskListClose}>✕</button>
                  </div>
                  <div className={styles.taskListItems}>
                    <div className={`${styles.taskItem} ${styles.taskDone}`}><span className={styles.taskCheck}>✓</span> {t.contentWeek1}</div>
                    <div className={`${styles.taskItem} ${styles.taskDone}`}><span className={styles.taskCheck}>✓</span> {t.productShoot1}</div>
                    <div className={`${styles.taskItem} ${styles.taskDone}`}><span className={styles.taskCheck}>✓</span> {t.menuDesign}</div>
                    <div className={`${styles.taskItem} ${styles.taskActive}`}><span className={styles.taskDot}>●</span> {t.reelsVideo} — عرض الأطباق</div>
                    <div className={`${styles.taskItem} ${styles.taskActive}`}><span className={styles.taskDot}>●</span> {t.ramadanCampaign}</div>
                    <div className={styles.taskItem}><span className={styles.taskEmpty}>○</span> {t.ramadanOffers}</div>
                    <div className={styles.taskItem}><span className={styles.taskEmpty}>○</span> {t.kitchenReels}</div>
                    <div className={styles.taskItem}><span className={styles.taskEmpty}>○</span> {t.contentWeek3}</div>
                  </div>
                </div>
              )}

              {/* Body: Infographic + Chat */}
              <div className={styles.clientBody}>
                {/* ===== INFOGRAPHIC ===== */}
                <div className={styles.infographic}>
                  <div className={styles.infoTitle}>
                    {t.progressPlanMonth}
                  </div>
                  <div className={styles.statsRow}>
                    <div className={styles.statBox}><div className={`${styles.statValue} ${styles.statGreen}`}>12</div><div className={styles.statLabel}>{t.completed}</div></div>
                    <div className={styles.statBox}><div className={`${styles.statValue} ${styles.statBlue}`}>5</div><div className={styles.statLabel}>{t.inProgress}</div></div>
                    <div className={styles.statBox}><div className={`${styles.statValue} ${styles.statYellow}`}>3</div><div className={styles.statLabel}>{t.lateTasks}</div></div>
                    <div className={styles.statBox}><div className={`${styles.statValue} ${styles.statRed}`}>0</div><div className={styles.statLabel}>{t.canceled}</div></div>
                  </div>
                  <div className={styles.progressSection}>
                    <div className={styles.progressLabel}><span className={styles.progressLabelText}>{t.totalProgress}</span><span className={styles.progressLabelValue}>60%</span></div>
                    <div className={styles.progressTrack}><div className={`${styles.progressFill} ${styles.progressFillGreen}`} style={{ width: '60%' }} /></div>
                  </div>
                  <div className={styles.progressSection}>
                    <div className={styles.progressLabel}><span className={styles.progressLabelText}>{t.deadlineAdherence}</span><span className={styles.progressLabelValue}>85%</span></div>
                    <div className={styles.progressTrack}><div className={`${styles.progressFill} ${styles.progressFillYellow}`} style={{ width: '85%' }} /></div>
                  </div>
                  <div className={styles.timeline}>
                    <div className={styles.timelineItem}><span className={`${styles.timelineDot} ${styles.dotGreen}`} /><span className={styles.timelineText}>{t.contentWeek1}</span></div>
                    <div className={styles.timelineItem}><span className={`${styles.timelineDot} ${styles.dotGreen}`} /><span className={styles.timelineText}>{t.productShoot1}</span></div>
                    <div className={styles.timelineItem}><span className={`${styles.timelineDot} ${styles.dotYellow}`} /><span className={styles.timelineText}>{t.reelsVideo}</span></div>
                    <div className={styles.timelineItem}><span className={`${styles.timelineDot} ${styles.dotRed}`} /><span className={styles.timelineText}>{t.ramadanOffers}</span></div>
                    <div className={styles.timelineItem}><span className={`${styles.timelineDot} ${styles.dotGray}`} /><span className={styles.timelineText}>{t.ramadanCampaign}</span></div>
                  </div>
                </div>

                {/* ===== CHAT SECTION ===== */}
                <div className={styles.chatSection}>
                  <div className={styles.chatHeader}>
                    <div className={styles.chatTitle}>{t.teamChat}</div>
                    <div className={styles.chatParticipants}>
                      <div className={`${styles.chatAvatar} ${styles.chatAvatarAi}`} title={t.remarkAssistant}>🤖</div>
                      <div className={`${styles.chatAvatar} ${styles.chatAvatarMktg}`} title={t.marketingManager}>M</div>
                      <div className={`${styles.chatAvatar} ${styles.chatAvatarAcct}`} title={t.accountManager}>A</div>
                    </div>
                  </div>
                  <div className={styles.chatMessages}>
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={styles.chatMsg}>
                        <div className={`${styles.chatMsgAvatar} ${msg.type === 'ai' ? styles.chatAvatarAi : msg.type === 'acct' ? styles.chatAvatarAcct : styles.chatAvatarMktg}`}>{msg.avatar}</div>
                        <div className={styles.chatBubble}>
                          <div className={styles.chatSender}>{msg.sender}</div>
                          <div className={styles.chatText}>{msg.text}</div>
                          <div className={styles.chatTime}>{msg.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form className={styles.chatInput} onSubmit={handleSendMessage}>
                    <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} className={styles.chatInputField} placeholder={t.typeMsg} />
                    <button type="submit" className={styles.chatSendBtn}>➤</button>
                  </form>
                </div>
              </div>

              {/* ===== CALENDAR ===== */}
              <div className={styles.calendarSection}>
                <div className={styles.calendarHeader}>
                  <div className={styles.calendarTitle}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    <span>{t.calendarTitle}</span>
                  </div>
                </div>
                <div className={styles.calendarGrid}>
                  {/* Days header */}
                  <div className={styles.calDayHeader}>{t.sun}</div>
                  <div className={styles.calDayHeader}>{t.mon}</div>
                  <div className={styles.calDayHeader}>{t.tue}</div>
                  <div className={styles.calDayHeader}>{t.wed}</div>
                  <div className={styles.calDayHeader}>{t.thu}</div>
                  <div className={styles.calDayHeader}>{t.fri}</div>
                  <div className={styles.calDayHeader}>{t.sat}</div>
                  {/* Previous month fill */}
                  {[24, 25, 26, 27, 28].map(d => <div key={`p${d}`} className={`${styles.calDay} ${styles.calDayOther}`}>{d}</div>)}
                  {/* March 2026 */}
                  <div className={`${styles.calDay} ${styles.calDayWeekend}`}>1</div>
                  {[2, 3, 4, 5].map(d => <div key={d} className={`${styles.calDay} ${styles.calDayDone}`}><span>{d}</span><span className={styles.calMark}>✓</span></div>)}
                  <div className={styles.calDay}>6</div>
                  <div className={`${styles.calDay} ${styles.calDayWeekend}`}>7</div>
                  <div className={`${styles.calDay} ${styles.calDayToday}`}><span>8</span><span className={styles.calTodayDot} /></div>
                  {[9, 10].map(d => <div key={d} className={`${styles.calDay} ${styles.calDayTask}`}><span>{d}</span><span className={styles.calTaskDot} /></div>)}
                  <div className={`${styles.calDay} ${styles.calDayLate}`}><span>11</span><span className={styles.calLateDot} /></div>
                  <div className={styles.calDay}>12</div>
                  <div className={styles.calDay}>13</div>
                  <div className={`${styles.calDay} ${styles.calDayWeekend}`}>14</div>
                  {[15, 16, 17, 18, 19, 20].map(d => <div key={d} className={styles.calDay}>{d}</div>)}
                  <div className={`${styles.calDay} ${styles.calDayWeekend}`}>21</div>
                  {[22, 23, 24, 25, 26, 27].map(d => <div key={d} className={styles.calDay}>{d}</div>)}
                  <div className={`${styles.calDay} ${styles.calDayWeekend}`}>28</div>
                  {[29, 30, 31].map(d => <div key={d} className={styles.calDay}>{d}</div>)}
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* ==================== WIZARD MODAL ==================== */}
      {showWizard && (
        <div className={styles.wizardOverlay} onClick={() => setShowWizard(false)}>
          <div className={styles.wizardModal} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.wizardHeader}>
              <h2 className={styles.wizardTitle}>{isEditMode ? t.editPlanTitle : t.wizardTitle}</h2>
              <button className={styles.wizardCloseBtn} onClick={() => setShowWizard(false)}>✕</button>
            </div>

            {/* Stepper */}
            <div className={styles.wizardStepper}>
              {[1, 2, 3, 4].map(step => (
                <div key={step} className={`${styles.wizardStepItem} ${wizardStep >= step ? styles.wizardStepActive : ''}`}>
                  <div className={styles.wizardStepCircle}>{step}</div>
                  <span className={styles.wizardStepLabel}>
                    {step === 1 ? t.wizardStep1 : step === 2 ? t.wizardStep2 : step === 3 ? t.wizardStep3 : t.wizardStep4}
                  </span>
                  {step < 4 && <div className={`${styles.wizardStepLine} ${wizardStep > step ? styles.wizardStepLineActive : ''}`} />}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className={styles.wizardBody}>

              {/* Step 1: Client Info */}
              {wizardStep === 1 && (
                <div className={styles.wizardGrid}>
                  <div className={styles.wizardField}>
                    <label>{t.wClientName} <span className={styles.wizardReq}>*</span></label>
                    <input type="text" placeholder={t.wClientNamePH} value={wizardData.clientName}
                      onChange={e => setWizardData({ ...wizardData, clientName: e.target.value })} />
                  </div>
                  <div className={styles.wizardField}>
                    <label>{t.wIndustry} <span className={styles.wizardReq}>*</span></label>
                    <select value={wizardData.industry} onChange={e => setWizardData({ ...wizardData, industry: e.target.value })}>
                      <option value="">{t.wSelectPlaceholder}</option>
                      {[...t.wIndustryOpts, ...wizardData.customIndustry].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    {!showCustom.industry ? (
                      <button className={styles.addCustomBtn} onClick={() => setShowCustom({ ...showCustom, industry: true })}>{t.wAddCustom}</button>
                    ) : (
                      <div className={styles.customInputRow}>
                        <input placeholder={t.wCustomPH} value={customInput.industry || ''} onChange={e => setCustomInput({ ...customInput, industry: e.target.value })} />
                        <button onClick={() => { if (customInput.industry?.trim()) { setWizardData({ ...wizardData, customIndustry: [...wizardData.customIndustry, customInput.industry.trim()], industry: customInput.industry.trim() }); setCustomInput({ ...customInput, industry: '' }); setShowCustom({ ...showCustom, industry: false }); } }}>✓</button>
                      </div>
                    )}
                  </div>
                  <div className={styles.wizardField}>
                    <label>{t.wPlanType} <span className={styles.wizardReq}>*</span></label>
                    <select value={wizardData.planType} onChange={e => setWizardData({ ...wizardData, planType: e.target.value })}>
                      <option value="">{t.wSelectPlaceholder}</option>
                      {[...t.wPlanTypeOpts, ...wizardData.customPlanType].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    {!showCustom.planType ? (
                      <button className={styles.addCustomBtn} onClick={() => setShowCustom({ ...showCustom, planType: true })}>{t.wAddCustom}</button>
                    ) : (
                      <div className={styles.customInputRow}>
                        <input placeholder={t.wCustomPH} value={customInput.planType || ''} onChange={e => setCustomInput({ ...customInput, planType: e.target.value })} />
                        <button onClick={() => { if (customInput.planType?.trim()) { setWizardData({ ...wizardData, customPlanType: [...wizardData.customPlanType, customInput.planType.trim()], planType: customInput.planType.trim() }); setCustomInput({ ...customInput, planType: '' }); setShowCustom({ ...showCustom, planType: false }); } }}>✓</button>
                      </div>
                    )}
                  </div>
                  <div className={styles.wizardField}>
                    <label>{t.wBudget}</label>
                    <input type="text" placeholder={t.wBudgetPH} value={wizardData.budget}
                      onChange={e => setWizardData({ ...wizardData, budget: e.target.value })} />
                  </div>
                  {/* Social Links */}
                  <div className={styles.wizardField + ' ' + styles.wizardFieldFull}>
                    <label>{t.wSocialLinks}</label>
                    {wizardData.socialLinks.map((link, i) => (
                      <div key={i} className={styles.socialLinkRow}>
                        <input type="url" placeholder={t.wSocialLinkPH} value={link}
                          onChange={e => { const links = [...wizardData.socialLinks]; links[i] = e.target.value; setWizardData({ ...wizardData, socialLinks: links }); }} />
                        {wizardData.socialLinks.length > 1 && (
                          <button className={styles.removeLinkBtn} onClick={() => { const links = wizardData.socialLinks.filter((_, j) => j !== i); setWizardData({ ...wizardData, socialLinks: links }); }}>✕</button>
                        )}
                      </div>
                    ))}
                    <button className={styles.addCustomBtn} onClick={() => setWizardData({ ...wizardData, socialLinks: [...wizardData.socialLinks, ''] })}>{t.wAddLink}</button>
                  </div>
                  {/* File Upload */}
                  <div className={styles.wizardField + ' ' + styles.wizardFieldFull}>
                    <label>{t.wUploadFiles}</label>
                    <div className={styles.uploadArea} onClick={() => document.getElementById('wizardFileInput')?.click()}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      <span>{t.wUploadHint}</span>
                      {wizardData.files.length > 0 && <span className={styles.uploadCount}>{wizardData.files.length} files</span>}
                    </div>
                    <input id="wizardFileInput" type="file" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files) setWizardData({ ...wizardData, files: [...wizardData.files, ...Array.from(e.target.files)] }); }} />
                    {wizardData.files.length > 0 && (
                      <div className={styles.fileList}>
                        {wizardData.files.map((f, i) => (
                          <div key={i} className={styles.fileItem}>
                            <span>📎 {f.name}</span>
                            <button onClick={() => setWizardData({ ...wizardData, files: wizardData.files.filter((_, j) => j !== i) })}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Goals & Strategy */}
              {wizardStep === 2 && (
                <div className={styles.wizardGrid}>
                  <div className={styles.wizardField + ' ' + styles.wizardFieldFull}>
                    <label>{t.wGoals} <span className={styles.wizardReq}>*</span></label>
                    <div className={styles.wizardChips}>
                      {[...t.wGoalsOpts, ...wizardData.customGoals].map(g => (
                        <button key={g} className={`${styles.wizardChip} ${wizardData.goals.includes(g) ? styles.wizardChipActive : ''}`}
                          onClick={() => setWizardData({ ...wizardData, goals: toggleArrayItem(wizardData.goals, g) })}>
                          {g}
                        </button>
                      ))}
                    </div>
                    {!showCustom.goals ? (
                      <button className={styles.addCustomBtn} onClick={() => setShowCustom({ ...showCustom, goals: true })}>{t.wAddCustom}</button>
                    ) : (
                      <div className={styles.customInputRow}>
                        <input placeholder={t.wCustomPH} value={customInput.goals || ''} onChange={e => setCustomInput({ ...customInput, goals: e.target.value })} />
                        <button onClick={() => { if (customInput.goals?.trim()) { setWizardData({ ...wizardData, customGoals: [...wizardData.customGoals, customInput.goals.trim()], goals: [...wizardData.goals, customInput.goals.trim()] }); setCustomInput({ ...customInput, goals: '' }); setShowCustom({ ...showCustom, goals: false }); } }}>✓</button>
                      </div>
                    )}
                  </div>
                  <div className={styles.wizardField + ' ' + styles.wizardFieldFull}>
                    <label>{t.wPlatforms} <span className={styles.wizardReq}>*</span></label>
                    <div className={styles.wizardChips}>
                      {[...t.wPlatformOpts, ...wizardData.customPlatforms].map(p => (
                        <button key={p} className={`${styles.wizardChip} ${wizardData.platforms.includes(p) ? styles.wizardChipActive : ''}`}
                          onClick={() => setWizardData({ ...wizardData, platforms: toggleArrayItem(wizardData.platforms, p) })}>
                          {p}
                        </button>
                      ))}
                    </div>
                    {!showCustom.platforms ? (
                      <button className={styles.addCustomBtn} onClick={() => setShowCustom({ ...showCustom, platforms: true })}>{t.wAddCustom}</button>
                    ) : (
                      <div className={styles.customInputRow}>
                        <input placeholder={t.wCustomPH} value={customInput.platforms || ''} onChange={e => setCustomInput({ ...customInput, platforms: e.target.value })} />
                        <button onClick={() => { if (customInput.platforms?.trim()) { setWizardData({ ...wizardData, customPlatforms: [...wizardData.customPlatforms, customInput.platforms.trim()], platforms: [...wizardData.platforms, customInput.platforms.trim()] }); setCustomInput({ ...customInput, platforms: '' }); setShowCustom({ ...showCustom, platforms: false }); } }}>✓</button>
                      </div>
                    )}
                  </div>
                  <div className={styles.wizardField + ' ' + styles.wizardFieldFull}>
                    <label>{t.wTargetAudience}</label>
                    <input type="text" placeholder={t.wTargetAudiencePH} value={wizardData.targetAudience}
                      onChange={e => setWizardData({ ...wizardData, targetAudience: e.target.value })} />
                  </div>
                </div>
              )}

              {/* Step 3: Content & Meetings */}
              {wizardStep === 3 && (
                <div className={styles.wizardGrid}>
                  <div className={styles.wizardField + ' ' + styles.wizardFieldFull}>
                    <label>{t.wContentTypes} <span className={styles.wizardReq}>*</span></label>
                    <div className={styles.wizardChips}>
                      {[...t.wContentOpts, ...wizardData.customContent].map(c => (
                        <button key={c} className={`${styles.wizardChip} ${wizardData.contentTypes.includes(c) ? styles.wizardChipActive : ''}`}
                          onClick={() => setWizardData({ ...wizardData, contentTypes: toggleArrayItem(wizardData.contentTypes, c) })}>
                          {c}
                        </button>
                      ))}
                    </div>
                    {!showCustom.content ? (
                      <button className={styles.addCustomBtn} onClick={() => setShowCustom({ ...showCustom, content: true })}>{t.wAddCustom}</button>
                    ) : (
                      <div className={styles.customInputRow}>
                        <input placeholder={t.wCustomPH} value={customInput.content || ''} onChange={e => setCustomInput({ ...customInput, content: e.target.value })} />
                        <button onClick={() => { if (customInput.content?.trim()) { setWizardData({ ...wizardData, customContent: [...wizardData.customContent, customInput.content.trim()], contentTypes: [...wizardData.contentTypes, customInput.content.trim()] }); setCustomInput({ ...customInput, content: '' }); setShowCustom({ ...showCustom, content: false }); } }}>✓</button>
                      </div>
                    )}
                  </div>
                  <div className={styles.wizardField}>
                    <label>{t.wPostsPerWeek}</label>
                    <input type="number" min="1" max="30" value={wizardData.postsPerWeek}
                      onChange={e => setWizardData({ ...wizardData, postsPerWeek: e.target.value })} />
                  </div>
                  <div className={styles.wizardField}>
                    <label>{t.wStartDate} <span className={styles.wizardReq}>*</span></label>
                    <input type="date" value={wizardData.startDate}
                      onChange={e => setWizardData({ ...wizardData, startDate: e.target.value })} />
                  </div>
                  {/* Meeting Brief */}
                  <div className={styles.wizardField + ' ' + styles.wizardFieldFull}>
                    <label>{t.wMeetingBrief}</label>
                    <textarea rows={3} placeholder={t.wMeetingBriefPH} value={wizardData.meetingBrief}
                      onChange={e => setWizardData({ ...wizardData, meetingBrief: e.target.value })} />
                  </div>
                  {/* Next Meeting */}
                  <div className={styles.wizardField}>
                    <label>{t.wNextMeeting}</label>
                    <input type="datetime-local" value={wizardData.nextMeetingDate}
                      onChange={e => setWizardData({ ...wizardData, nextMeetingDate: e.target.value })} />
                  </div>
                  <div className={styles.wizardField}>
                    <label>{t.wMeetingAttendees}</label>
                    <div className={styles.wizardChips}>
                      {t.wTeamMembers.map((m: string) => (
                        <button key={m} className={`${styles.wizardChip} ${wizardData.meetingAttendees.includes(m) ? styles.wizardChipActive : ''}`}
                          onClick={() => setWizardData({ ...wizardData, meetingAttendees: wizardData.meetingAttendees.includes(m) ? wizardData.meetingAttendees.filter(x => x !== m) : [...wizardData.meetingAttendees, m] })}>{m}</button>
                      ))}
                    </div>
                    {wizardData.meetingAttendees.length > 0 && (
                      <div className={styles.reviewChips} style={{ marginTop: 6 }}>
                        {wizardData.meetingAttendees.map(a => <span key={a} className={styles.reviewChip} style={{ cursor: 'pointer' }} onClick={() => setWizardData({ ...wizardData, meetingAttendees: wizardData.meetingAttendees.filter(x => x !== a) })}>{a} ✕</span>)}
                      </div>
                    )}
                  </div>
                  {/* Notes */}
                  <div className={styles.wizardField + ' ' + styles.wizardFieldFull}>
                    <label>{t.wNotes}</label>
                    <textarea rows={2} placeholder={t.wNotesPH} value={wizardData.notes}
                      onChange={e => setWizardData({ ...wizardData, notes: e.target.value })} />
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {wizardStep === 4 && (
                <div className={styles.wizardReview}>
                  <div className={styles.wizardReviewGrid}>
                    <div className={styles.reviewItem}><span className={styles.reviewLabel}>{t.wClientName}</span><span className={styles.reviewValue}>{wizardData.clientName || '—'}</span></div>
                    <div className={styles.reviewItem}><span className={styles.reviewLabel}>{t.wIndustry}</span><span className={styles.reviewValue}>{wizardData.industry || '—'}</span></div>
                    <div className={styles.reviewItem}><span className={styles.reviewLabel}>{t.wPlanType}</span><span className={styles.reviewValue}>{wizardData.planType || '—'}</span></div>
                    <div className={styles.reviewItem}><span className={styles.reviewLabel}>{t.wBudget}</span><span className={styles.reviewValue}>{wizardData.budget || '—'}</span></div>
                    <div className={styles.reviewItem}><span className={styles.reviewLabel}>{t.wStartDate}</span><span className={styles.reviewValue}>{wizardData.startDate || '—'}</span></div>
                    <div className={styles.reviewItem}><span className={styles.reviewLabel}>{t.wPostsPerWeek}</span><span className={styles.reviewValue}>{wizardData.postsPerWeek}/week</span></div>
                  </div>
                  {wizardData.goals.length > 0 && (
                    <div className={styles.reviewSection}>
                      <span className={styles.reviewLabel}>{t.wGoals}</span>
                      <div className={styles.reviewChips}>{wizardData.goals.map(g => <span key={g} className={styles.reviewChip}>{g}</span>)}</div>
                    </div>
                  )}
                  {wizardData.platforms.length > 0 && (
                    <div className={styles.reviewSection}>
                      <span className={styles.reviewLabel}>{t.wPlatforms}</span>
                      <div className={styles.reviewChips}>{wizardData.platforms.map(p => <span key={p} className={styles.reviewChip}>{p}</span>)}</div>
                    </div>
                  )}
                  {wizardData.contentTypes.length > 0 && (
                    <div className={styles.reviewSection}>
                      <span className={styles.reviewLabel}>{t.wContentTypes}</span>
                      <div className={styles.reviewChips}>{wizardData.contentTypes.map(c => <span key={c} className={styles.reviewChip}>{c}</span>)}</div>
                    </div>
                  )}
                  {wizardData.meetingAttendees.length > 0 && (
                    <div className={styles.reviewSection}>
                      <span className={styles.reviewLabel}>{t.wMeetingAttendees}</span>
                      <div className={styles.reviewChips}>{wizardData.meetingAttendees.map(a => <span key={a} className={styles.reviewChip}>{a}</span>)}</div>
                    </div>
                  )}
                  {wizardData.socialLinks.filter(l => l.trim()).length > 0 && (
                    <div className={styles.reviewSection}>
                      <span className={styles.reviewLabel}>{t.wSocialLinks}</span>
                      <div className={styles.reviewChips}>{wizardData.socialLinks.filter(l => l.trim()).map(l => <span key={l} className={styles.reviewChip}>🔗 {l}</span>)}</div>
                    </div>
                  )}
                  {wizardData.meetingBrief && (
                    <div className={styles.reviewSection}>
                      <span className={styles.reviewLabel}>{t.wMeetingBrief}</span>
                      <p className={styles.reviewNotes}>{wizardData.meetingBrief}</p>
                    </div>
                  )}
                  {wizardData.notes && (
                    <div className={styles.reviewSection}>
                      <span className={styles.reviewLabel}>{t.wNotes}</span>
                      <p className={styles.reviewNotes}>{wizardData.notes}</p>
                    </div>
                  )}
                  {wizardData.files.length > 0 && (
                    <div className={styles.reviewSection}>
                      <span className={styles.reviewLabel}>{t.wUploadFiles}</span>
                      <div className={styles.reviewChips}>{wizardData.files.map((f, i) => <span key={i} className={styles.reviewChip}>📎 {f.name}</span>)}</div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Footer */}
            <div className={styles.wizardFooter}>
              {wizardStep > 1 && (
                <button className={styles.wizardBtnSecondary} onClick={() => setWizardStep(s => s - 1)}>{t.wPrev}</button>
              )}
              <div style={{ flex: 1 }} />
              {wizardStep < 4 ? (
                <button className={styles.wizardBtnPrimary} onClick={() => setWizardStep(s => s + 1)}>{t.wNext}</button>
              ) : (
                <button className={styles.wizardBtnSubmit} onClick={() => {
                  if (isEditMode) {
                    // Update existing client
                    if (editingClientType === 'warda') {
                      setWardaData(wizardData as any);
                    } else if (editingClientType === 'converted' && editingClientIdx !== null) {
                      setConvertedClients(prev => prev.map((cc, i) => i === editingClientIdx ? { ...cc, name: wizardData.clientName || cc.name, data: { ...cc.data, ...wizardData } } : cc));
                    }
                    setShowWizard(false);
                    setIsEditMode(false);
                    setEditingClientType(null);
                    setEditingClientIdx(null);
                  } else {
                    // Create pipeline card
                    setPipelineClients(prev => [...prev, { name: wizardData.clientName || 'New Client', stage: 0, data: wizardData }]);
                    setShowWizard(false);
                  }
                }}>{isEditMode ? t.saveChanges : t.wSubmit}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== AGREEMENT MODAL ==================== */}
      {showAgreement && (
        <div className={styles.wizardOverlay} onClick={() => setShowAgreement(false)}>
          <div className={styles.wizardModal} style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className={styles.wizardHeader}>
              <h2 className={styles.wizardTitle}>{t.wAgreementTitle}</h2>
              <button className={styles.wizardCloseBtn} onClick={() => setShowAgreement(false)}>✕</button>
            </div>
            <div className={styles.wizardBody}>
              <div className={styles.wizardGrid}>
                <div className={styles.wizardField + ' ' + styles.wizardFieldFull}>
                  <label>{t.wAgreedBudget} <span className={styles.wizardReq}>*</span></label>
                  <input type="text" placeholder={t.wAgreedBudgetPH} value={agreementData.agreedBudget}
                    onChange={e => setAgreementData({ ...agreementData, agreedBudget: e.target.value })} />
                </div>
                <div className={styles.wizardField}>
                  <label>{t.wAccountMgr} <span className={styles.wizardReq}>*</span></label>
                  <select value={agreementData.accountMgr} onChange={e => setAgreementData({ ...agreementData, accountMgr: e.target.value })}>
                    <option value="">{t.wSelectPlaceholder}</option>
                    {t.wAccountMgrOpts.map((o: string) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className={styles.wizardField}>
                  <label>{t.wContractDuration} <span className={styles.wizardReq}>*</span></label>
                  <select value={agreementData.contractDuration} onChange={e => setAgreementData({ ...agreementData, contractDuration: e.target.value })}>
                    <option value="">{t.wSelectPlaceholder}</option>
                    {t.wContractOpts.map((o: string) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className={styles.wizardFooter}>
              <div style={{ flex: 1 }} />
              <button className={styles.wizardBtnSubmit} disabled={isConverting} style={isConverting ? { opacity: 0.5, cursor: 'not-allowed' } : undefined} onClick={() => {
                handleConvertToClient(agreementIdx);
              }}>{isConverting ? (lang === 'ar' ? '⏳ جاري التحويل...' : '⏳ Converting...') : t.wConfirmAgreement}</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT PLAN CLIENT SELECTOR ==================== */}
      {showEditPlanSelector && (
        <div className={styles.wizardOverlay} onClick={() => setShowEditPlanSelector(false)}>
          <div className={styles.clientSelectorModal} onClick={e => e.stopPropagation()}>
            <div className={styles.wizardHeader}>
              <h2 className={styles.wizardTitle}>{t.selectClient}</h2>
              <button className={styles.wizardCloseBtn} onClick={() => setShowEditPlanSelector(false)}>✕</button>
            </div>
            <div className={styles.clientSelectorList}>
              {/* الوردة */}
              <div className={styles.clientSelectorItem} onClick={() => {
                setEditingClientType('warda');
                setEditingClientIdx(null);
                setIsEditMode(true);
                setWizardData(wardaData as any);
                setShowEditPlanSelector(false);
                setShowWizard(true);
                setWizardStep(1);
              }}>
                <div className={styles.clientSelectorAvatar}>🌹</div>
                <div className={styles.clientSelectorInfo}>
                  <div className={styles.clientSelectorName}>{t.clientName}</div>
                  <div className={styles.clientSelectorSub}>{t.clientType}</div>
                </div>
                <div className={styles.clientSelectorArrow}>←</div>
              </div>
              {/* Converted clients */}
              {convertedClients.map((cc: any, ci: number) => (
                <div key={ci} className={styles.clientSelectorItem} onClick={() => {
                  setEditingClientType('converted');
                  setEditingClientIdx(ci);
                  setIsEditMode(true);
                  setWizardData({
                    clientName: cc.name || '', industry: cc.data?.industry || '', planType: cc.data?.planType || '',
                    budget: cc.data?.budget || '', goals: cc.data?.goals || [], platforms: cc.data?.platforms || [],
                    targetAudience: cc.data?.targetAudience || '', contentTypes: cc.data?.contentTypes || [],
                    postsPerWeek: cc.data?.postsPerWeek || '5', startDate: cc.data?.startDate || '',
                    notes: cc.data?.notes || '', socialLinks: cc.data?.socialLinks || [''],
                    files: [], meetingBrief: cc.data?.meetingBrief || '',
                    nextMeetingDate: cc.data?.nextMeetingDate || '',
                    meetingAttendees: cc.data?.meetingAttendees || [],
                    customIndustry: cc.data?.customIndustry || [], customPlanType: cc.data?.customPlanType || [],
                    customGoals: cc.data?.customGoals || [], customPlatforms: cc.data?.customPlatforms || [],
                    customContent: cc.data?.customContent || [],
                  });
                  setShowEditPlanSelector(false);
                  setShowWizard(true);
                  setWizardStep(1);
                }}>
                  <div className={styles.clientSelectorAvatar}>✅</div>
                  <div className={styles.clientSelectorInfo}>
                    <div className={styles.clientSelectorName}>{cc.name}</div>
                    <div className={styles.clientSelectorSub}>{cc.data?.industry} • {cc.data?.planType}</div>
                  </div>
                  <div className={styles.clientSelectorArrow}>←</div>
                </div>
              ))}
              {convertedClients.length === 0 && (
                <div className={styles.clientSelectorEmpty}>
                  <span>🌹 {t.clientName}</span>
                  <span style={{ opacity: 0.5, fontSize: 12, marginTop: 4 }}>{lang === 'ar' ? 'هو العميل الوحيد حالياً' : 'is the only client currently'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUMMARY CLIENT SELECTOR ==================== */}
      {showSummarySelector && (
        <div className={styles.wizardOverlay} onClick={() => setShowSummarySelector(false)}>
          <div className={styles.clientSelectorModal} onClick={e => e.stopPropagation()}>
            <div className={styles.wizardHeader}>
              <h2 className={styles.wizardTitle}>{t.selectClient}</h2>
              <button className={styles.wizardCloseBtn} onClick={() => setShowSummarySelector(false)}>✕</button>
            </div>
            <div className={styles.clientSelectorList}>
              {/* الوردة */}
              <div className={styles.clientSelectorItem} onClick={() => {
                setSummaryClientType('warda');
                setSummaryClientIdx(null);
                setSummaryData({ month: '', year: '2026', postsPublished: '', engagement: '', followersGained: '', bestPost: '', highlights: '', challenges: '', recommendations: '', clientFeedback: '' });
                setShowSummarySelector(false);
                setShowMonthlySummary(true);
              }}>
                <div className={styles.clientSelectorAvatar}>🌹</div>
                <div className={styles.clientSelectorInfo}>
                  <div className={styles.clientSelectorName}>{t.clientName}</div>
                  <div className={styles.clientSelectorSub}>{t.clientType}</div>
                </div>
                <div className={styles.clientSelectorArrow}>←</div>
              </div>
              {/* Converted clients */}
              {convertedClients.map((cc: any, ci: number) => (
                <div key={ci} className={styles.clientSelectorItem} onClick={() => {
                  setSummaryClientType('converted');
                  setSummaryClientIdx(ci);
                  setSummaryData({ month: '', year: '2026', postsPublished: '', engagement: '', followersGained: '', bestPost: '', highlights: '', challenges: '', recommendations: '', clientFeedback: '' });
                  setShowSummarySelector(false);
                  setShowMonthlySummary(true);
                }}>
                  <div className={styles.clientSelectorAvatar}>✅</div>
                  <div className={styles.clientSelectorInfo}>
                    <div className={styles.clientSelectorName}>{cc.name}</div>
                    <div className={styles.clientSelectorSub}>{cc.data?.industry} • {cc.data?.planType}</div>
                  </div>
                  <div className={styles.clientSelectorArrow}>←</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MONTHLY SUMMARY MODAL ==================== */}
      {showMonthlySummary && (
        <div className={styles.wizardOverlay} onClick={() => setShowMonthlySummary(false)}>
          <div className={styles.wizardModal} onClick={e => e.stopPropagation()}>
            <div className={styles.wizardHeader}>
              <h2 className={styles.wizardTitle}>
                {t.summaryTitle} — {summaryClientType === 'warda' ? t.clientName : convertedClients[summaryClientIdx || 0]?.name}
              </h2>
              <button className={styles.wizardCloseBtn} onClick={() => setShowMonthlySummary(false)}>✕</button>
            </div>
            <div className={styles.wizardBody}>
              <div className={styles.wizardGrid}>
                {/* Month & Year */}
                <div className={styles.wizardField}>
                  <label>{t.summaryMonth} <span className={styles.wizardReq}>*</span></label>
                  <select value={summaryData.month} onChange={e => setSummaryData({ ...summaryData, month: e.target.value })}>
                    <option value="">{t.wSelectPlaceholder}</option>
                    {t.summaryMonths.map((m: string, i: number) => <option key={i} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className={styles.wizardField}>
                  <label>{t.summaryYear}</label>
                  <select value={summaryData.year} onChange={e => setSummaryData({ ...summaryData, year: e.target.value })}>
                    {['2025', '2026', '2027'].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                {/* Stats Row */}
                <div className={styles.wizardField}>
                  <label>{t.summaryPostsPublished}</label>
                  <input type="number" min="0" value={summaryData.postsPublished}
                    onChange={e => setSummaryData({ ...summaryData, postsPublished: e.target.value })} placeholder="0" />
                </div>
                <div className={styles.wizardField}>
                  <label>{t.summaryEngagement}</label>
                  <input type="number" min="0" value={summaryData.engagement}
                    onChange={e => setSummaryData({ ...summaryData, engagement: e.target.value })} placeholder="0" />
                </div>
                <div className={styles.wizardField}>
                  <label>{t.summaryFollowersGained}</label>
                  <input type="number" min="0" value={summaryData.followersGained}
                    onChange={e => setSummaryData({ ...summaryData, followersGained: e.target.value })} placeholder="0" />
                </div>
                <div className={styles.wizardField}>
                  <label>{t.summaryBestPost}</label>
                  <input type="text" value={summaryData.bestPost}
                    onChange={e => setSummaryData({ ...summaryData, bestPost: e.target.value })} placeholder={t.summaryBestPostPH} />
                </div>

                {/* Highlights */}
                <div className={styles.wizardField + ' ' + styles.wizardFieldFull}>
                  <label>{t.summaryHighlights} <span className={styles.wizardReq}>*</span></label>
                  <textarea rows={3} value={summaryData.highlights}
                    onChange={e => setSummaryData({ ...summaryData, highlights: e.target.value })} placeholder={t.summaryHighlightsPH} />
                </div>

                {/* Challenges */}
                <div className={styles.wizardField + ' ' + styles.wizardFieldFull}>
                  <label>{t.summaryChallenges}</label>
                  <textarea rows={3} value={summaryData.challenges}
                    onChange={e => setSummaryData({ ...summaryData, challenges: e.target.value })} placeholder={t.summaryChallengesPH} />
                </div>

                {/* Recommendations */}
                <div className={styles.wizardField + ' ' + styles.wizardFieldFull}>
                  <label>{t.summaryRecommendations} <span className={styles.wizardReq}>*</span></label>
                  <textarea rows={3} value={summaryData.recommendations}
                    onChange={e => setSummaryData({ ...summaryData, recommendations: e.target.value })} placeholder={t.summaryRecommendationsPH} />
                </div>

                {/* Client Feedback */}
                <div className={styles.wizardField + ' ' + styles.wizardFieldFull}>
                  <label>{t.summaryClientFeedback}</label>
                  <textarea rows={2} value={summaryData.clientFeedback}
                    onChange={e => setSummaryData({ ...summaryData, clientFeedback: e.target.value })} placeholder={t.summaryClientFeedbackPH} />
                </div>
              </div>
            </div>
            <div className={styles.wizardFooter}>
              <div style={{ flex: 1 }} />
              <button className={styles.wizardBtnSubmit} onClick={() => {
                const clientName = summaryClientType === 'warda' ? t.clientName : convertedClients[summaryClientIdx || 0]?.name;
                const key = `${clientName}_${summaryData.month}_${summaryData.year}`;
                // Save the summary
                setMonthlySummaries(prev => ({
                  ...prev,
                  [clientName]: [...(prev[clientName] || []), { ...summaryData, savedAt: new Date().toISOString() }]
                }));
                // Add AI message to the relevant chat
                const summaryMsg = `${t.summarySuccess.replace('{month}', summaryData.month).replace('{client}', clientName)}\n\n📊 ${t.summaryPostsPublished}: ${summaryData.postsPublished || '—'}\n💬 ${t.summaryEngagement}: ${summaryData.engagement || '—'}\n👥 ${t.summaryFollowersGained}: ${summaryData.followersGained || '—'}\n⭐ ${t.summaryBestPost}: ${summaryData.bestPost || '—'}\n\n📈 ${t.summaryHighlights}:\n${summaryData.highlights || '—'}\n\n🎯 ${t.summaryRecommendations}:\n${summaryData.recommendations || '—'}`;

                if (summaryClientType === 'warda') {
                  setChatMessages(prev => [...prev, {
                    sender: t.remarkAssistant, text: summaryMsg, time: 'AI', avatar: '🤖', type: 'ai'
                  }]);
                } else if (summaryClientIdx !== null) {
                  setConvertedChatMsgs(prev => ({
                    ...prev,
                    [summaryClientIdx]: [...(prev[summaryClientIdx] || []), {
                      sender: t.remarkAssistant, avatar: '🤖', text: summaryMsg, time: 'AI', type: 'ai'
                    }]
                  }));
                }
                setShowMonthlySummary(false);
              }}>{t.summarySubmit}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
