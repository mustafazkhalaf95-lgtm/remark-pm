export type Lang = "en" | "ar";

export const translations = {
    en: {
        // Nav
        navOpenApp: "Open Application",
        navAllRoles: "← All Roles",

        // Hero
        heroBadge: "We're hiring",
        heroTitle1: "Shape the Future",
        heroTitle2: "With Us",
        heroSubtitle: (count: number) =>
            `We're building something extraordinary. Join our creative, ambitious team and make your mark across ${count} open positions.`,
        statRoles: "Open Roles",
        statWork: "Flexible Work",
        statWorkVal: "Remote",
        statGrowth: "Growth",
        statGrowthVal: "Fast",

        // Job card
        applyNow: "Apply Now →",
        viewDetails: "View Details",
        hideDetails: "Close Details",
        respTitle: "Responsibilities",
        reqsTitle: "Requirements",

        // Footer
        footerText: (year: number) => `© ${year} remark®. All rights reserved.`,

        // Apply page header
        applyTitle: "Join Our Team",
        applySubtitle: "Tell us about yourself — we'd love to meet you.",

        // Form labels
        fieldRole: "Role",
        fieldRolePlaceholder: "— Select a role —",
        fieldFullName: "Full Name",
        fieldFullNamePlaceholder: "Jane Doe",
        fieldWorkType: "Work Preference",
        fieldWorkTypePlaceholder: "— Select Work Type —",
        workTypeRemote: "Remote",
        workTypeHybrid: "Hybrid",
        workTypeOnSite: "On-site",
        fieldPhone: "Phone",
        fieldPhonePlaceholder: "+964 7XX XXX XXXX",
        fieldEmail: "Email",
        fieldEmailPlaceholder: "jane@example.com",
        fieldCity: "City",
        fieldCityPlaceholder: "Baghdad",
        fieldYearsExp: "Years of Experience",
        fieldYearsExpPlaceholder: "3",
        fieldSalary: "Expected Salary",
        fieldSalaryPlaceholder: "1,500,000 IQD / month",
        fieldPortfolio: "Portfolio / LinkedIn URL",
        fieldPortfolioPlaceholder: "https://yourportfolio.com",
        fieldCv: "CV / Resume (PDF)",
        fieldCvUpload: "Click to upload your CV (PDF only)",
        fieldSkill: "Strongest Skill",
        fieldSkillPlaceholder: "e.g. Facebook Ads, Motion Graphics, Copywriting…",
        fieldWhyJoin: "Why do you want to join?",
        fieldWhyJoinPlaceholder: "Tell us what excites you about this opportunity…",
        submitBtn: "Submit Application",
        submittingBtn: "Submitting…",
        confidential: "Your information is kept strictly confidential.",

        // Success
        successTitle: "Application Submitted!",
        successMsg:
            "Thank you for applying. We'll review your application and get back to you within 5–7 business days.",
        successBtn: "Submit Another",
        successBackBtn: "Return to Roles",

        // Roles
        roles: {
            "marketing-manager": {
                title: "Marketing Manager",
                description: "Lead multi-channel campaigns, define brand positioning, and drive measurable growth across all marketing funnels.",
                responsibilities: [
                    "Develop and execute comprehensive marketing strategies across digital and traditional channels.",
                    "Manage marketing budgets, allocate resources, and track ROI carefully.",
                    "Collaborate with sales, product, and creative teams to align on goals.",
                    "Analyze market trends, customer behavior, and competitor activities."
                ],
                requirements: [
                    "5+ years of experience in marketing management or a similar role.",
                    "Deep understanding of digital marketing channels (SEO, PPC, email, social).",
                    "Strong analytical skills to interpret data and translate it into actionable insights.",
                    "Excellent leadership and communication abilities."
                ]
            },
            "marketing-coordinator": {
                title: "Marketing Coordinator",
                description: "Coordinate marketing initiatives, manage project timelines, and keep cross-functional teams aligned on deliverables.",
                responsibilities: [
                    "Assist in the development and implementation of marketing campaigns.",
                    "Maintain project schedules and coordinate with team members to ensure timely delivery.",
                    "Prepare reports on campaign performance and track key metrics.",
                    "Organize and maintain marketing assets and promotional materials."
                ],
                requirements: [
                    "1-3 years of proven experience in a marketing coordination or administrative role.",
                    "Exceptional organizational and time-management skills.",
                    "Familiarity with marketing tools and project management software.",
                    "Strong attention to detail and ability to multitask effectively."
                ]
            },
            "social-media-specialist": {
                title: "Social Media Specialist",
                description: "Craft compelling content calendars, grow our community, and turn followers into brand advocates.",
                responsibilities: [
                    "Develop and maintain engaging content calendars for platforms including Instagram, TikTok, LinkedIn, and Twitter.",
                    "Engage with our followers, respond to comments, and moderate community discussions.",
                    "Analyze engagement data to optimize posting schedules and content formats.",
                    "Collaborate with graphic designers and videographers to produce high-quality visual assets."
                ],
                requirements: [
                    "2+ years of experience managing brand social media accounts.",
                    "Excellent copywriting skills with a strong grasp of platform-specific tone of voice.",
                    "Proficiency with social media analytics and scheduling tools.",
                    "Creative mindset with an eye for current trends."
                ]
            },
            "media-buyer": {
                title: "Media Buyer",
                description: "Plan, purchase, and optimize paid media across Meta, Google, TikTok and beyond to maximize ROAS.",
                responsibilities: [
                    "Create and execute paid advertising campaigns across major platforms (Meta, Google Ads, TikTok Ads).",
                    "Monitor budgets daily, perform A/B testing on creatives, and optimize campaigns for ROAS.",
                    "Identify target audiences and plan media buying strategies accordingly.",
                    "Generate detailed performance reports and provide strategic recommendations."
                ],
                requirements: [
                    "3+ years of hands-on experience in paid media buying and optimization.",
                    "Demonstrated success managing large ad budgets and hitting CPA/ROAS targets.",
                    "Advanced knowledge of ad platforms, tracking pixels, and attribution models.",
                    "Strong analytical mindset and proficiency in Excel/Google Sheets."
                ]
            },
            "creative-director": {
                title: "Creative Director",
                description: "Set the visual and conceptual direction of the brand, overseeing design, copy, and creative production.",
                responsibilities: [
                    "Lead the creative team to develop innovative concepts for brand campaigns and client projects.",
                    "Ensure all creative output aligns with brand guidelines and quality standards.",
                    "Mentors designers, copywriters, and video producers to elevate their work.",
                    "Pitch creative concepts to internal stakeholders and key clients."
                ],
                requirements: [
                    "7+ years of creative experience with at least 3 years in a leadership/directional role.",
                    "A stunning portfolio showcasing successful, multi-channel creative campaigns.",
                    "Deep understanding of design, typography, video production, and copywriting.",
                    "Stellar presentation and communication skills."
                ]
            },
            copywriter: {
                title: "Copywriter",
                description: "Write persuasive, on-brand copy for ads, landing pages, emails, and everything in between.",
                responsibilities: [
                    "Write compelling, clear, and action-oriented copy for varied marketing channels.",
                    "Adapt tone and style to suit different platforms, products, and target audiences.",
                    "Collaborate closely with designers to ensure copy and visuals work seamlessly together.",
                    "Proofread and edit content for accuracy, grammar, and brand voice consistency."
                ],
                requirements: [
                    "2-5 years of professional copywriting experience, ideally in an agency or dynamic brand.",
                    "Excellent command of the English language.",
                    "Strong portfolio demonstrating versatility in writing styles.",
                    "Ability to grasp complex concepts and translate them into simple, engaging text."
                ]
            },
            "account-manager": {
                title: "Account Manager",
                description: "Build lasting client relationships, manage expectations, and ensure exceptional delivery across every account.",
                responsibilities: [
                    "Serve as the primary point of contact for assigned clients, building strong, trusted relationships.",
                    "Understand client objectives and coordinate with internal teams to deliver successful campaigns.",
                    "Manage project timelines, scope, and client expectations proactively.",
                    "Identify opportunities for account growth and upselling additional services."
                ],
                requirements: [
                    "3+ years of account management or client success experience in an agency setting.",
                    "Exceptional interpersonal, negotiation, and conflict-resolution skills.",
                    "Proven ability to manage multiple client accounts simultaneously.",
                    "Strong understanding of digital marketing services."
                ]
            },
            videographer: {
                title: "Videographer",
                description: "Shoot high-quality video content for brand campaigns, social media, and product storytelling.",
                responsibilities: [
                    "Capture professional-grade video footage on set and on location.",
                    "Set up and operate lighting, audio, and camera equipment.",
                    "Collaborate with the creative director to storyboard and plan shoots.",
                    "Maintain and organize all camera equipment and raw footage files."
                ],
                requirements: [
                    "3+ years of professional experience as a videographer or cinematographer.",
                    "Proficiency with cinema cameras, lighting kits, and professional audio setups.",
                    "A strong reel showcasing technical skill and creative storytelling.",
                    "Ability to work dynamically on location and adapt to changing environments."
                ]
            },
            "video-editor": {
                title: "Video Editor",
                description: "Transform raw footage into polished, engaging videos with sharp cuts, motion graphics, and sound design.",
                responsibilities: [
                    "Edit raw video footage into polished, compelling narratives for various platforms.",
                    "Create and integrate motion graphics, lower thirds, and visual effects.",
                    "Perform color grading and audio mixing to ensure broadcast-quality output.",
                    "Manage multiple editing projects and meet tight delivery deadlines."
                ],
                requirements: [
                    "3+ years of experience in video editing and post-production.",
                    "Mastery of Adobe Premiere Pro, After Effects, and standard post-production workflows.",
                    "Strong sense of pacing, storytelling, and rhythm in video.",
                    "Attention to detail and ability to take constructive creative feedback."
                ]
            },
        } as Record<string, { title: string; description: string; responsibilities: string[]; requirements: string[] }>,
    },

    ar: {
        // Nav
        navOpenApp: "قدّم الآن",
        navAllRoles: "→ جميع الوظائف",

        // Hero
        heroBadge: "نحن نوظّف",
        heroTitle1: "اصنع المستقبل",
        heroTitle2: "معنا",
        heroSubtitle: (count: number) =>
            `نحن نبني شيئاً استثنائياً. انضم إلى فريقنا المبدع الطموح وأثبت نفسك في ${count} وظيفة شاغرة.`,
        statRoles: "وظيفة شاغرة",
        statWork: "عمل مرن",
        statWorkVal: "عن بُعد",
        statGrowth: "نمو",
        statGrowthVal: "سريع",

        // Job card
        applyNow: "قدّم الآن ←",
        viewDetails: "عرض التفاصيل",
        hideDetails: "إخفاء التفاصيل",
        respTitle: "المسؤوليات:",
        reqsTitle: "المتطلبات:",

        // Footer
        footerText: (year: number) => `© ${year} remark®. جميع الحقوق محفوظة.`,

        // Apply page header
        applyTitle: "انضم إلى فريقنا",
        applySubtitle: "أخبرنا عن نفسك — يسعدنا التعرف عليك.",

        // Form labels
        fieldRole: "الوظيفة",
        fieldRolePlaceholder: "— اختر وظيفة —",
        fieldFullName: "الاسم الكامل",
        fieldFullNamePlaceholder: "محمد علي",
        fieldWorkType: "طبيعة العمل المفضلة",
        fieldWorkTypePlaceholder: "— اختر طبيعة العمل —",
        workTypeRemote: "عن بُعد (Remote)",
        workTypeHybrid: "هجين (Hybrid)",
        workTypeOnSite: "مكتبي (On-site)",
        fieldPhone: "رقم الهاتف",
        fieldPhonePlaceholder: "+964 7XX XXX XXXX",
        fieldEmail: "البريد الإلكتروني",
        fieldEmailPlaceholder: "example@email.com",
        fieldCity: "المدينة",
        fieldCityPlaceholder: "بغداد",
        fieldYearsExp: "سنوات الخبرة",
        fieldYearsExpPlaceholder: "3",
        fieldSalary: "الراتب المتوقع",
        fieldSalaryPlaceholder: "مثال: 1,500,000 د.ع / شهر",
        fieldPortfolio: "رابط الملف الشخصي / LinkedIn",
        fieldPortfolioPlaceholder: "https://portfolio.com",
        fieldCv: "السيرة الذاتية (PDF)",
        fieldCvUpload: "انقر لرفع سيرتك الذاتية (PDF فقط)",
        fieldSkill: "أبرز مهاراتك",
        fieldSkillPlaceholder: "مثال: إعلانات فيسبوك، تصميم حركي، كتابة إبداعية…",
        fieldWhyJoin: "لماذا تريد الانضمام إلينا؟",
        fieldWhyJoinPlaceholder: "أخبرنا ما الذي يُحمسك في هذه الفرصة…",
        submitBtn: "إرسال الطلب",
        submittingBtn: "جارٍ الإرسال…",
        confidential: "معلوماتك تُحفظ بسرية تامة.",

        // Success
        successTitle: "!تم إرسال طلبك",
        successMsg:
            "شكراً لتقديمك. سنراجع طلبك ونتواصل معك خلال 5–7 أيام عمل.",
        successBtn: "تقديم طلب آخر",
        successBackBtn: "العودة للوظائف",

        // Roles
        roles: {
            "marketing-manager": {
                title: "مدير التسويق",
                description: "قيادة حملات تسويقية متعددة القنوات، وتحديد موقع العلامة التجارية، وتحقيق نمو قابل للقياس.",
                responsibilities: [
                    "تطوير وتنفيذ استراتيجيات تسويقية شاملة عبر القنوات الرقمية والتقليدية.",
                    "إدارة ميزانيات التسويق وتخصيص الموارد وتتبع العائد على الاستثمار.",
                    "التعاون مع فرق المبيعات والمنتجات والإبداع لتحقيق الأهداف.",
                    "تحليل اتجاهات السوق وسلوك العملاء وأنشطة المنافسين."
                ],
                requirements: [
                    "خبرة 5+ سنوات في إدارة التسويق أو دور مشابه.",
                    "فهم عميق لقنوات التسويق الرقمي (SEO، PPC، البريد الإلكتروني، सोशल ميديا).",
                    "مهارات تحليلية قوية لتفسير البيانات وتحويلها إلى أفكار قابلة للتنفيذ.",
                    "قدرات ممتازة في القيادة والتواصل."
                ]
            },
            "marketing-coordinator": {
                title: "منسّق التسويق",
                description: "تنسيق المبادرات التسويقية وإدارة الجداول الزمنية للمشاريع للحفاظ على انسجام الفرق.",
                responsibilities: [
                    "المساعدة في تطوير وتنفيذ الحملات التسويقية.",
                    "الحفاظ على جداول المشاريع والتنسيق مع أعضاء الفريق لضمان التسليم في الوقت المحدد.",
                    "إعداد تقارير عن أداء الحملات وتتبع المقاييس الرئيسية.",
                    "تنظيم وصيانة الأصول التسويقية والمواد الترويجية."
                ],
                requirements: [
                    "خبرة 1-3 سنوات في التنسيق التسويقي أو دور إداري.",
                    "مهارات استثنائية في التنظيم وإدارة الوقت.",
                    "الإلمام بأدوات التسويق وبرامج إدارة المشاريع.",
                    "انتباه شديد للتفاصيل وقدرة على تعدد المهام بفعالية."
                ]
            },
            "social-media-specialist": {
                title: "متخصص وسائل التواصل الاجتماعي",
                description: "إنشاء تقاويم محتوى جذابة، وتنمية المجتمع، وتحويل المتابعين إلى مؤيدين للعلامة.",
                responsibilities: [
                    "تطوير تقاويم محتوى تفاعلية لمنصات مثل إنستجرام، تيك توك، ولينكد إن.",
                    "التفاعل مع المتابعين والرد على التعليقات وإدارة المناقشات.",
                    "تحليل بيانات التفاعل لتحسين أوقات النشر وأنماط المحتوى.",
                    "التعاون مع المصممين وصناع الفيديو لإنتاج محتوى مرئي عالي الجودة."
                ],
                requirements: [
                    "خبرة سنتين فأكثر في إدارة حسابات العلامات التجارية.",
                    "مهارات كتابة إبداعية ممتازة مع فهم نبرة كل منصة.",
                    "إجادة استخدام أدوات الجدولة وتحليلات السوشيال ميديا.",
                    "عقلية إبداعية ومواكبة للمستجدات والتريندات."
                ]
            },
            "media-buyer": {
                title: "مشتري الوسائط الإعلانية",
                description: "التخطيط والشراء والتحسين للإعلانات المدفوعة عبر ميتا وجوجل وتيك توك لتعظيم العائد.",
                responsibilities: [
                    "إنشاء وإدارة حملات إعلانية مدفوعة عبر المنصات الكبرى.",
                    "مراقبة الميزانيات يومياً وعمل اختبارات A/B لتحسين العائد (ROAS).",
                    "تحديد الجماهير المستهدفة وتخطيط استراتيجيات الشراء.",
                    "إعداد تقارير أداء تفصيلية وتقديم توصيات استراتيجية."
                ],
                requirements: [
                    "خبرة 3+ سنوات عملية في إطلاق وتحسين الإعلانات المدفوعة.",
                    "سجل حافل في إدارة ميزانيات كبيرة وتحقيق أهداف الـ CPA و ROAS.",
                    "معرفة متقدمة بمنصات الإعلانات ونماذج الإحالة (Attribution).",
                    "مهارات تحليلية قوية في استخدام الجداول الإلكترونية لمعالجة البيانات."
                ]
            },
            "creative-director": {
                title: "المدير الإبداعي",
                description: "تحديد التوجه البصري والإبداعي للعلامة التجارية والإشراف على التصميم والإنتاج.",
                responsibilities: [
                    "قيادة الفريق الإبداعي لتطوير أفكار مبتكرة لحملات العلامة التجارية.",
                    "ضمان توافق جميع المخرجات الإبداعية مع إرشادات العلامة ومعايير الجودة.",
                    "توجيه المصممين والكتاب وصناع الفيديو لرفع مستوى أعمالهم.",
                    "عرض الأفكار الإبداعية على أصحاب المصلحة الداخليين والعملاء."
                ],
                requirements: [
                    "خبرة 7+ سنوات في المجال الإبداعي، منها 3 سنوات على الأقل في دور قيادي.",
                    "محفظة أعمال مبهرة تستعرض حملات ناجحة.",
                    "فهم عميق للتصميم والتوصيف وإنتاج الفيديو وتأليف الإعلانات.",
                    "مهارات عرض وتواصل استثنائية."
                ]
            },
            copywriter: {
                title: "كاتب محتوى",
                description: "كتابة نصوص مقنعة ومتوافقة مع هوية العلامة للإعلانات والصفحات المقصودة والبريد الإلكتروني.",
                responsibilities: [
                    "كتابة نصوص مقنعة وواضحة لقنوات التسويق المختلفة.",
                    "تكييف النبرة والأسلوب لتناسب مختلف المنصات والمنتجات والجمهور المستهدف.",
                    "التعاون عن كثب مع المصممين لضمان انسجام النصوص والصور.",
                    "تدقيق وتعديل المحتوى لضمان الدقة والقواعد اللغوية."
                ],
                requirements: [
                    "خبرة 2-5 سنوات ككاتب محتوى، يفضل في وكالة إعلانية.",
                    "إجادة تامة للغة العربية (والإنجليزية ميزة إضافية).",
                    "محفظة أعمال متنوعة الأساليب الكتابية.",
                    "القدرة على تبسيط المفاهيم المعقدة في نصوص جذابة ومباشرة."
                ]
            },
            "account-manager": {
                title: "مدير الحسابات",
                description: "بناء علاقات طويلة الأمد مع العملاء وضمان تقديم خدمة استثنائية لكل حساب.",
                responsibilities: [
                    "العمل كنقطة اتصال رئيسية للعملاء، وبناء علاقات قوية وموثوقة.",
                    "فهم أهداف العملاء والتنسيق مع الفرق للتنفيذ بنجاح.",
                    "إدارة الجداول الزمنية والنطاقات وتوقعات العملاء بشكل استباقي.",
                    "تحديد فرص لنمو الحسابات أو بيع خدمات إضافية."
                ],
                requirements: [
                    "خبرة 3+ سنوات في إدارة حسابات العملاء داخل بيئة وكالات التسويق.",
                    "مهارات استثنائية في التواصل والتفاوض وحل المشكلات.",
                    "القدرة المثبتة على إدارة ملفات عملاء متعددة في وقت واحد.",
                    "فهم قوي لخدمات التسويق الرقمي وحلولها."
                ]
            },
            videographer: {
                title: "مصوّر فيديو",
                description: "تصوير محتوى فيديو عالي الجودة لحملات العلامة التجارية ووسائل التواصل والقصص.",
                responsibilities: [
                    "تصوير مواد بصرية عالية الجودة في الاستوديو والمواقع الخارجية.",
                    "إعداد وتشغيل معدات الإضاءة والصوت والكاميرات.",
                    "التعاون مع المدير الإبداعي لرسم الستوري بورد وتخطيط جلسات التصوير.",
                    "المحافظة على معدات التصوير وتنظيم الملفات الأولية."
                ],
                requirements: [
                    "خبرة احترافية تزيد عن 3 سنوات في تصوير الفيديو.",
                    "كفاءة في التعامل مع الكاميرات السينمائية ومعدات الإضاءة والصوت المتقدمة.",
                    "ملف أعمال قوي يعكس المهارة الفنية وأسلوب سرد القصص المرئي.",
                    "المرونة والقدرة العالية على العمل في مواقع متعددة متغيرة بمهارة."
                ]
            },
            "video-editor": {
                title: "مونتير فيديو",
                description: "تحويل اللقطات الخام إلى فيديوهات احترافية جذابة بتقطيع دقيق ورسوم متحركة.",
                responsibilities: [
                    "تحرير اللقطات الخام لتكوين فيديوهات سردية وجذابة למختلف المنصات.",
                    "إنشاء ودمج الرسومات المتحركة (Motion Graphics) والمؤثرات البصرية.",
                    "تنفيذ تصحيح الألوان (Color Grading) ومزج الأصوات باحترافية.",
                    "إدارة مشاريع متعددة الأبعاد والالتزام بالمواعيد النهائية الصارمة."
                ],
                requirements: [
                    "خبرة تزيد عن 3 سنوات في تحرير الفيديو والـ Post-production.",
                    "إتقان العمل على برامج مثل Adobe Premiere Pro و After Effects.",
                    "إحساس عالٍ بالإيقاع وسرد القصص في الفيديو.",
                    "اهتمام دقيق بالتفاصيل والقدرة على استيعاب التوجيهات الفنية."
                ]
            },
        } as Record<string, { title: string; description: string; responsibilities: string[]; requirements: string[] }>,
    },
} as const;

export type Translations = (typeof translations)["en"];
