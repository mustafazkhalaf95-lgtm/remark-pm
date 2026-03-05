"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

const texts = {
  ar: {
    marketingTeam: "التسويق",
    date: "5 مارس 2026",
    buildPlan: "بناء خطة تسويقية لعميل جديد",
    buildPlanDesc: "أنشئ خطة تسويقية شاملة تتضمن الأهداف والاستراتيجيات والجداول الزمنية",
    editPlan: "تعديل الخطة التسويقية لعميل",
    editPlanDesc: "قم بتحديث وتعديل الخطة التسويقية الحالية بناءً على النتائج والمستجدات",
    monthlyUpdate: "إعطاء مستجدات ملخص الشهر لعميل",
    monthlyUpdateDesc: "قدّم تقريراً شهرياً بالإنجازات والتحليلات والتوصيات للعميل",
    clients: "العملاء",
    clientCount: "1 عميل",
    clientName: "الوردة",
    clientType: "مطعم • خطة شهرية",
    progress: "التقدم",
    activeTasks: "مهام نشطة",
    lateTasks: "متأخرة",
    newMessages: "رسائل جديدة",
    clickToOpen: "اضغط للفتح",
    taskListTitle: "📝 قائمة المهام — الوردة",
    taskListHint: "قائمة المهام",
    newTask: "＋ مهمة جديدة",
    minimize: "تصغير",
    progressPlanMonth: "📈 تقدم خطة الشهر — مارس 2026",
    completed: "مكتملة",
    inProgress: "قيد التنفيذ",
    canceled: "ملغاة",
    totalProgress: "التقدم الكلي",
    deadlineAdherence: "الالتزام بالمواعيد",
    contentWeek1: "محتوى سوشيال",
    productShoot1: "تصوير منتجات",
    menuDesign: "تصميم قائمة الطعام",
    reelsVideo: "فيديو ريلز",
    ramadanCampaign: "حملة إعلانية",
    ramadanOffers: "تصميم عروض",
    kitchenReels: "فيديو ريلز — كواليس",
    contentWeek3: "محتوى سوشيال — أسبوع 3",
    teamChat: "💬 محادثة الفريق",
    remarkAssistant: "مساعد ريمارك",
    assistantMsg1: "صباح الخير! 👋 بناءً على تحليل الأداء الأسبوعي، أقترح التركيز على محتوى الفيديو هذا الأسبوع — معدل التفاعل كان أعلى بـ 3x مقارنة بالتصاميم.",
    marketingManager: "مدير التسويق",
    managerMsg: "ممتاز! خلينا نجهز 3 ريلز جديدة هالأسبوع. وديان، شو أخبار المحتوى اللي طلبه العميل؟",
    accountManager: "أكاونت منجر",
    accountManagerMsg: "العميل وافق على المحتوى الأسبوع الماضي ✅ بس عنده ملاحظة على الألوان في آخر تصميم.",
    assistantMsg2: "✨ تم تحديث مهمة \"تعديل ألوان التصميم\" تلقائياً. الموعد النهائي: بعد غد.",
    typeMsg: "اكتب رسالة...",
    calendarTitle: "تقويم المهام — مارس 2026",
    themeToggle: "الوضع الفاتح/الداكن",
    langToggle: "تغيير اللغة",
    addViewer: "إضافة مشاهدين",
    ceo: "المدير التنفيذي",
    coo: "المدير التشغيلي",
    designer: "مصمم جرافيك",
    // Wizard
    wizardTitle: "📋 بناء خطة تسويقية لعميل جديد",
    wizardStep1: "معلومات العميل",
    wizardStep2: "الأهداف والاستراتيجية",
    wizardStep3: "المحتوى والاجتماعات",
    wizardStep4: "المراجعة والإرسال",
    wClientName: "اسم العميل",
    wClientNamePH: "مثال: الوردة",
    wIndustry: "القطاع",
    wIndustryOpts: ["مطاعم ومقاهي", "عقارات", "تجارة إلكترونية", "صحة وجمال", "تعليم", "تقنية"],
    wPlanType: "نوع الخطة",
    wPlanTypeOpts: ["شهرية", "ربع سنوية", "سنوية", "حملة خاصة"],
    wBudget: "الميزانية الشهرية التقديرية",
    wBudgetPH: "مثال: 5,000 دولار",
    wGoals: "الأهداف التسويقية",
    wGoalsOpts: ["زيادة الوعي بالعلامة", "زيادة المبيعات", "زيادة المتابعين", "تحسين التفاعل", "إطلاق منتج جديد", "بناء الهوية البصرية"],
    wPlatforms: "المنصات المستهدفة",
    wPlatformOpts: ["Instagram", "TikTok", "Snapchat", "X (Twitter)", "Facebook", "LinkedIn", "YouTube", "Google Ads"],
    wTargetAudience: "الجمهور المستهدف",
    wTargetAudiencePH: "مثال: شباب 18-35 سنة في بغداد",
    wContentTypes: "أنواع المحتوى",
    wContentOpts: ["تصاميم سوشيال", "فيديو ريلز", "تصوير منتجات", "موشن جرافيك", "كتابة محتوى", "حملات إعلانية"],
    wPostsPerWeek: "عدد المنشورات أسبوعياً",
    wStartDate: "تاريخ البداية",
    wSocialLinks: "روابط صفحات التواصل الاجتماعي",
    wSocialLinkPH: "https://instagram.com/...",
    wAddLink: "＋ إضافة رابط",
    wUploadFiles: "رفع ملفات (اختياري)",
    wUploadHint: "اسحب الملفات هنا أو اضغط للاختيار",
    wMeetingBrief: "بريف الاجتماع الأولي",
    wMeetingBriefPH: "ملخص ما تم مناقشته في الاجتماع الأول مع العميل...",
    wNextMeeting: "موعد الاجتماع الثاني",
    wMeetingAttendees: "الحاضرون في الاجتماع",
    wTeamMembers: ["مصطفى خلف", "يوسف", "أحمد", "موسى", "حسنين", "وديان", "سيف", "عبدالله", "محمد"],
    wAddCustom: "＋ إضافة خيار آخر",
    wCustomPH: "اكتب خياراً جديداً...",
    wNotes: "ملاحظات إضافية",
    wNotesPH: "أي تفاصيل أخرى يريد مدير التسويق إضافتها...",
    wNext: "التالي ←",
    wPrev: "→ السابق",
    wSubmit: "✨ إرسال للمساعد الذكي",
    wClose: "إغلاق",
    wRequired: "مطلوب",
    wSelectPlaceholder: "اختر...",
    wAddPerson: "＋ إضافة شخص",
    wAddPersonPH: "اسم الشخص...",
    // Pipeline
    potentialClient: "🎯 عميل محتمل",
    pipelineStages: ["تواصل أولي", "اجتماع أول", "عرض سعر", "تفاوض", "اتفاق"],
    pipelineTitle: "مراحل التوصل لاتفاق",
    pNoClients: "لا يوجد عملاء محتملين حالياً",
    pScheduleMeeting: "📅 تحديد موعد اجتماع",
    pChangeStatus: "🔄 تغيير الحالة",
    pExportPlan: "📤 تصدير الخطة",
    pExportJSON: "📄 تصدير JSON",
    pExportPDF: "📃 تصدير PDF",
    pExportNotebook: "📓 إرسال إلى NotebookLM",
    pExportClipboard: "📎 نسخ للحافظة",
    pEditPlan: "✏️ تعديل الخطة",
    pAiChat: "🤖 حوار مع AI",
    pAddPerson: "👤 إضافة شخص",
    pMeetingDate: "تاريخ الاجتماع",
    pMeetingTime: "الوقت",
    pSelectAttendees: "اختر الحاضرين",
    // Stage-specific
    stageContactSource: "مصدر التواصل",
    stageContactSourceOpts: ["إحالة", "إعلان مدفوع", "سوشيال ميديا", "بحث مباشر", "معرفة سابقة"],
    stageInterestLevel: "مستوى الاهتمام",
    stageInterestOpts: ["مرتفع 🔥", "متوسط ⚡", "منخفض 💤"],
    stageContactNotes: "ملاحظات التواصل الأولي",
    stageContactNotesPH: "ماذا ناقشتم؟ ما الذي يبحث عنه العميل؟",
    stageMeetingBrief: "ملخص الاجتماع",
    stageMeetingBriefPH: "أهم النقاط التي تمت مناقشتها...",
    stageQuoteTitle: "💰 تفاصيل عرض السعر",
    stageQuoteAmount: "المبلغ المقترح",
    stageQuoteAmountPH: "مثلاً: 5,000 ر.س/شهرياً",
    stageQuoteServices: "الخدمات المشمولة",
    stageQuoteNotes: "ملاحظات العرض",
    stageQuoteNotesPH: "تفاصيل إضافية عن العرض...",
    stageSendQuote: "📨 إرسال العرض",
    stageNegTitle: "🤝 تفاصيل التفاوض",
    stageNegCounterOffer: "العرض المضاد من العميل",
    stageNegCounterOfferPH: "المبلغ أو التعديلات المطلوبة",
    stageNegOurResponse: "ردنا",
    stageNegOurResponsePH: "كيف نرد على العرض المضاد...",
    stageNegStatus: "حالة التفاوض",
    stageNegStatusOpts: ["بانتظار رد العميل", "بانتظار ردنا", "تم التوصل لاتفاق", "الغاء"],
    stageSaveNotes: "💾 حفظ",
    // Agreement stage
    wAgreementTitle: "📝 تفاصيل الاتفاق",
    wAgreedBudget: "الميزانية المتفق عليها",
    wAgreedBudgetPH: "المبلغ النهائي المتفق عليه",
    wAccountMgr: "الأكاونت منجر المسؤول",
    wAccountMgrOpts: ["وديان", "سيف"],
    wContractDuration: "مدة العقد",
    wContractOpts: ["شهر", "3 أشهر", "6 أشهر", "سنة"],
    wConfirmAgreement: "✅ تأكيد الاتفاق وتحويل لعميل",
    // Conversion
    conversionMsg: "🎉 مبروك! تم تحويل {name} إلى عميل رسمي.",
    calendarGenerated: "📅 تم إنشاء جدول المحتوى بناءً على الخطة التسويقية:",
    calWeek: "الأسبوع",
    calTask: "المهمة",
    calPlatform: "المنصة",
    sun: "أحد", mon: "إثن", tue: "ثلا", wed: "أربع", thu: "خمي", fri: "جمعة", sat: "سبت"
  },
  en: {
    marketingTeam: "Marketing",
    date: "March 5, 2026",
    buildPlan: "Build marketing plan for a new client",
    buildPlanDesc: "Create a comprehensive marketing plan that includes goals, strategies, and timelines.",
    editPlan: "Modify a client's marketing plan",
    editPlanDesc: "Update and modify the current marketing plan based on results and new developments.",
    monthlyUpdate: "Provide a monthly summary update",
    monthlyUpdateDesc: "Provide the client with a monthly report detailing achievements, analyses, and recommendations.",
    clients: "Customers",
    clientCount: "1 client",
    clientName: "The Rose",
    clientType: "Restaurant • Monthly Plan",
    progress: "Progress",
    activeTasks: "Active tasks",
    lateTasks: "Late",
    newMessages: "New messages",
    clickToOpen: "Click to open",
    taskListTitle: "📝 Task List — The Rose",
    taskListHint: "Task list",
    newTask: "＋ New mission",
    minimize: "Minimize",
    progressPlanMonth: "📈 Monthly Plan Progress — March 2026",
    completed: "Complete",
    inProgress: "In progress",
    canceled: "Cancelled",
    totalProgress: "Overall progress",
    deadlineAdherence: "Adherence to deadlines",
    contentWeek1: "Social content",
    productShoot1: "Product photography",
    menuDesign: "Menu design",
    reelsVideo: "Reels video",
    ramadanCampaign: "Ad campaign",
    ramadanOffers: "Offers design",
    kitchenReels: "Behind the scenes",
    teamChat: "💬 Team Chat",
    remarkAssistant: "Remark Assistant",
    assistantMsg1: "Good morning! 👋 Based on the weekly performance analysis, I suggest focusing on video content this week — the engagement rate was 3x higher compared to static designs.",
    marketingManager: "Marketing Manager",
    managerMsg: "Great! Let's get 3 new reels ready this week. Dian, what's the latest on the content requested?",
    accountManager: "Account Manager",
    accountManagerMsg: "The client approved the content last week ✅ but they had a comment on the colors in the latest design.",
    assistantMsg2: "✨ \"Adjust design colors\" task has been updated automatically. Deadline: The day after tomorrow.",
    typeMsg: "Type a message...",
    calendarTitle: "Task Calendar — March 2026",
    themeToggle: "Light/Dark Mode",
    langToggle: "Change language",
    addViewer: "Add Viewer",
    ceo: "CEO",
    coo: "COO",
    designer: "Graphic Designer",
    // Wizard
    wizardTitle: "📋 Build a Marketing Plan for a New Client",
    wizardStep1: "Client Info",
    wizardStep2: "Goals & Strategy",
    wizardStep3: "Content & Meetings",
    wizardStep4: "Review & Submit",
    wClientName: "Client Name",
    wClientNamePH: "e.g. The Rose",
    wIndustry: "Industry",
    wIndustryOpts: ["Restaurants & Cafés", "Real Estate", "E-commerce", "Health & Beauty", "Education", "Technology"],
    wPlanType: "Plan Type",
    wPlanTypeOpts: ["Monthly", "Quarterly", "Annual", "Special Campaign"],
    wBudget: "Estimated Monthly Budget",
    wBudgetPH: "e.g. $5,000",
    wGoals: "Marketing Goals",
    wGoalsOpts: ["Brand Awareness", "Increase Sales", "Grow Followers", "Improve Engagement", "Product Launch", "Visual Identity"],
    wPlatforms: "Target Platforms",
    wPlatformOpts: ["Instagram", "TikTok", "Snapchat", "X (Twitter)", "Facebook", "LinkedIn", "YouTube", "Google Ads"],
    wTargetAudience: "Target Audience",
    wTargetAudiencePH: "e.g. Youth 18-35 in Baghdad",
    wContentTypes: "Content Types",
    wContentOpts: ["Social Designs", "Reels Video", "Product Photography", "Motion Graphics", "Copywriting", "Ad Campaigns"],
    wPostsPerWeek: "Posts per Week",
    wStartDate: "Start Date",
    wSocialLinks: "Social Media Links",
    wSocialLinkPH: "https://instagram.com/...",
    wAddLink: "＋ Add Link",
    wUploadFiles: "Upload Files (Optional)",
    wUploadHint: "Drag files here or click to browse",
    wMeetingBrief: "Initial Meeting Brief",
    wMeetingBriefPH: "Summary of what was discussed in the first meeting with the client...",
    wNextMeeting: "Next Meeting Date",
    wMeetingAttendees: "Meeting Attendees",
    wTeamMembers: ["Mustafa Khalaf", "Yousif", "Ahmed", "Musa", "Hassanin", "Wedyan", "Saif", "Abdullah", "Mohammed"],
    wAddCustom: "＋ Add Custom Option",
    wCustomPH: "Type a new option...",
    wNotes: "Additional Notes",
    wNotesPH: "Any other details the marketing manager wants to add...",
    wNext: "Next →",
    wPrev: "← Previous",
    wSubmit: "✨ Send to AI Assistant",
    wClose: "Close",
    wRequired: "Required",
    wSelectPlaceholder: "Select...",
    wAddPerson: "＋ Add Person",
    wAddPersonPH: "Person name...",
    // Pipeline
    potentialClient: "🎯 Potential Client",
    pipelineStages: ["Initial Contact", "First Meeting", "Proposal", "Negotiation", "Agreement"],
    pipelineTitle: "Deal Pipeline",
    pNoClients: "No potential clients at the moment",
    pScheduleMeeting: "📅 Schedule Meeting",
    pChangeStatus: "🔄 Change Status",
    pExportPlan: "📤 Export Plan",
    pExportJSON: "📄 Export JSON",
    pExportPDF: "📃 Export PDF",
    pExportNotebook: "📓 Send to NotebookLM",
    pExportClipboard: "📎 Copy to Clipboard",
    pEditPlan: "✏️ Edit Plan",
    pAiChat: "🤖 AI Chat",
    pAddPerson: "👤 Add Person",
    pMeetingDate: "Meeting Date",
    pMeetingTime: "Time",
    pSelectAttendees: "Select Attendees",
    // Stage-specific
    stageContactSource: "Contact Source",
    stageContactSourceOpts: ["Referral", "Paid Ad", "Social Media", "Direct Search", "Previous Connection"],
    stageInterestLevel: "Interest Level",
    stageInterestOpts: ["High 🔥", "Medium ⚡", "Low 💤"],
    stageContactNotes: "Initial Contact Notes",
    stageContactNotesPH: "What did you discuss? What is the client looking for?",
    stageMeetingBrief: "Meeting Brief",
    stageMeetingBriefPH: "Key points discussed...",
    stageQuoteTitle: "💰 Quotation Details",
    stageQuoteAmount: "Proposed Amount",
    stageQuoteAmountPH: "e.g. $5,000/month",
    stageQuoteServices: "Included Services",
    stageQuoteNotes: "Quote Notes",
    stageQuoteNotesPH: "Additional details about the quote...",
    stageSendQuote: "📨 Send Quote",
    stageNegTitle: "🤝 Negotiation Details",
    stageNegCounterOffer: "Client Counter-Offer",
    stageNegCounterOfferPH: "Amount or requested adjustments",
    stageNegOurResponse: "Our Response",
    stageNegOurResponsePH: "How we respond to the counter-offer...",
    stageNegStatus: "Negotiation Status",
    stageNegStatusOpts: ["Awaiting Client", "Awaiting Us", "Agreement Reached", "Cancelled"],
    stageSaveNotes: "💾 Save",
    // Agreement stage
    wAgreementTitle: "📝 Agreement Details",
    wAgreedBudget: "Agreed Budget",
    wAgreedBudgetPH: "Final agreed amount",
    wAccountMgr: "Assigned Account Manager",
    wAccountMgrOpts: ["Wedyan", "Saif"],
    wContractDuration: "Contract Duration",
    wContractOpts: ["1 Month", "3 Months", "6 Months", "1 Year"],
    wConfirmAgreement: "✅ Confirm & Convert to Client",
    // Conversion
    conversionMsg: "🎉 Congrats! {name} has been converted to an official client.",
    calendarGenerated: "📅 Content calendar generated from the marketing plan:",
    calWeek: "Week",
    calTask: "Task",
    calPlatform: "Platform",
    contentWeek3: "Social content - Week 3",
    sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat"
  }
};

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
  const [pipelineClients, setPipelineClients] = useState<{ name: string; stage: number; data: any }[]>([]);
  const [showAgreement, setShowAgreement] = useState(false);
  const [agreementIdx, setAgreementIdx] = useState(-1);
  const [agreementData, setAgreementData] = useState({ agreedBudget: '', accountMgr: '', contractDuration: '' });
  // Pipeline expanded actions
  const [pipelineExpanded, setPipelineExpanded] = useState<Record<number, string | null>>({});
  const [pipelineMeetingData, setPipelineMeetingData] = useState<Record<number, { date: string; attendees: string[] }>>({});
  const [pipelineNewPerson, setPipelineNewPerson] = useState<Record<number, string>>({});
  const [expandedPipelineIdx, setExpandedPipelineIdx] = useState<number | null>(null);
  const [pipelineStageData, setPipelineStageData] = useState<Record<number, Record<number, any>>>({});
  const [convertedClients, setConvertedClients] = useState<any[]>([]);
  const [activeStagePanel, setActiveStagePanel] = useState<Record<number, number | null>>({});
  const [expandedConvertedIdx, setExpandedConvertedIdx] = useState<number | null>(null);
  const [showConvertedTaskList, setShowConvertedTaskList] = useState<Record<number, boolean>>({});
  const [convertedChatInput, setConvertedChatInput] = useState<Record<number, string>>({});
  const [convertedChatMsgs, setConvertedChatMsgs] = useState<Record<number, any[]>>({});
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages(prev => [...prev, {
      sender: texts[lang].marketingManager,
      text: chatInput,
      time: timeString,
      avatar: "M",
      type: "mktg"
    }]);
    setChatInput("");
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

  // Handle converting pipeline client to actual client
  const handleConvertToClient = (idx: number) => {
    const pc = pipelineClients[idx];
    const stageInfo = pipelineStageData[idx] || {};
    const calendarTasks = generateCalendarFromPlan(pc.data);

    // Build calendar summary message
    const calLines = calendarTasks.map(ct =>
      `  📌 ${t.calWeek} ${ct.week} - ${ct.day}: ${ct.task} (${ct.platform})`
    ).join('\n');

    const convMsg = t.conversionMsg.replace('{name}', pc.name);

    // Build task items from calendar (first 8 tasks)
    const taskItems = calendarTasks.slice(0, 8).map((ct, i) => ({
      text: `${t.calWeek} ${ct.week} - ${ct.day}: ${ct.task} (${ct.platform})`,
      status: i < 0 ? 'done' : 'pending' // all pending initially
    }));

    // Create converted client
    const newClient = {
      name: pc.name,
      data: { ...pc.data, ...agreementData, stageHistory: stageInfo },
      calendar: calendarTasks,
      tasks: taskItems,
      convertedAt: new Date().toISOString(),
      aiMessage: `${convMsg}\n\n${t.calendarGenerated}\n${calLines}`,
    };

    const newIdx = convertedClients.length;
    setConvertedClients(prev => [...prev, newClient]);

    // Initialize chat messages for this client
    setConvertedChatMsgs(prev => ({
      ...prev,
      [newIdx]: [{
        sender: t.remarkAssistant,
        avatar: '🤖',
        text: `${convMsg}\n\n${t.calendarGenerated}\n${calLines}`,
        time: 'AI',
        type: 'ai'
      }]
    }));

    // Remove from pipeline
    const updated = pipelineClients.filter((_: any, i: number) => i !== idx);
    setPipelineClients(updated);
    setExpandedPipelineIdx(null);
    setShowAgreement(false);
    setAgreementData({ agreedBudget: '', accountMgr: '', contractDuration: '' });
    setExpandedConvertedIdx(newIdx);
    setExpanded(false);
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
        </div>
      </header>

      {/* ==================== CONTENT ==================== */}
      <main className={styles.content}>

        {/* ==================== ACTION CARDS ==================== */}
        <div className={styles.actionCards}>
          <div className={`${styles.actionCard} ${styles.actionCardBlue}`} onClick={() => { setShowWizard(true); setWizardStep(1); }}>
            <div>
              <div className={`${styles.actionIcon} ${styles.actionIconBlue}`}>📋</div>
              <div className={styles.actionTitle}>{t.buildPlan}</div>
              <div className={styles.actionDesc}>{t.buildPlanDesc}</div>
            </div>
            <div className={styles.actionArrow}>→</div>
          </div>
          <div className={`${styles.actionCard} ${styles.actionCardPurple}`}>
            <div>
              <div className={`${styles.actionIcon} ${styles.actionIconPurple}`}>✏️</div>
              <div className={styles.actionTitle}>{t.editPlan}</div>
              <div className={styles.actionDesc}>{t.editPlanDesc}</div>
            </div>
            <div className={styles.actionArrow}>→</div>
          </div>
          <div className={`${styles.actionCard} ${styles.actionCardCyan}`}>
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
                <span className={styles.sectionCount}>{pipelineClients.length}</span>
              </div>
              {pipelineClients.map((pc, idx) => (
                <div key={idx}>
                  {/* ===== COLLAPSED Pipeline Card ===== */}
                  {expandedPipelineIdx !== idx && (
                    <div className={`${styles.clientCardSmall} ${styles.horizontalCard} ${styles.pipelineCardSmall}`} onClick={() => setExpandedPipelineIdx(idx)}>
                      <div className={styles.horizontalCardContent}>
                        <div className={styles.horizontalCardRight}>
                          <div className={styles.smallAvatar}>🎯</div>
                          <div className={styles.smallNameBox}>
                            <div className={styles.smallName}>{pc.name}</div>
                            <div className={styles.smallSubtitle}>{pc.data.industry} • {pc.data.planType}</div>
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
                                const w = window.open('', '_blank');
                                if (w) {
                                  w.document.write(`<html dir="rtl"><head><title>${pc.name}</title><style>body{font-family:sans-serif;padding:40px;direction:rtl}h1{color:#6366f1}table{width:100%;border-collapse:collapse;margin:20px 0}td,th{border:1px solid #ddd;padding:10px;text-align:right}th{background:#f5f3ff}</style></head><body><h1>🎯 ${pc.name}</h1><table><tr><th>القطاع</th><td>${pc.data.industry}</td></tr><tr><th>نوع الخطة</th><td>${pc.data.planType}</td></tr><tr><th>الميزانية</th><td>${pc.data.budget}</td></tr><tr><th>الأهداف</th><td>${(pc.data.goals || []).join(', ')}</td></tr><tr><th>المنصات</th><td>${(pc.data.platforms || []).join(', ')}</td></tr><tr><th>أنواع المحتوى</th><td>${(pc.data.contentTypes || []).join(', ')}</td></tr></table></body></html>`);
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
                                      else {
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
                            </div>
                            <form className={styles.chatInput} onSubmit={e => { e.preventDefault(); }}>
                              <input type="text" className={styles.chatInputField} placeholder={t.typeMsg} />
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
          <span className={styles.sectionCount}>{t.clientCount}</span>
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
              <h2 className={styles.wizardTitle}>{t.wizardTitle}</h2>
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
                  // Create pipeline card
                  setPipelineClients(prev => [...prev, { name: wizardData.clientName || 'New Client', stage: 0, data: wizardData }]);
                  setShowWizard(false);
                }}>{t.wSubmit}</button>
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
              <button className={styles.wizardBtnSubmit} onClick={() => {
                handleConvertToClient(agreementIdx);
              }}>{t.wConfirmAgreement}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
