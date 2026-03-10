import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'Remark@2026!';

async function main() {
    console.log('🌱 Seeding Remark PM database...\n');

    // ═══════════════════════════════════════════════════════════
    // 1. ORGANIZATION
    // ═══════════════════════════════════════════════════════════
    const org = await prisma.organization.create({
        data: {
            name: 'Remark',
            nameAr: 'ريمارك',
            timezone: 'Asia/Baghdad',
            language: 'ar',
            workWeek: 'sun-thu',
        },
    });
    console.log('  ✅ Organization created');

    // ═══════════════════════════════════════════════════════════
    // 2. DEPARTMENTS
    // ═══════════════════════════════════════════════════════════
    const deptDefs = [
        { name: 'Marketing', nameAr: 'التسويق', slug: 'marketing', color: '#22c55e', icon: '📋' },
        { name: 'Creative', nameAr: 'الإبداعي', slug: 'creative', color: '#8b5cf6', icon: '🎨' },
        { name: 'Production', nameAr: 'الإنتاج', slug: 'production', color: '#f59e0b', icon: '🎬' },
        { name: 'Publishing', nameAr: 'النشر', slug: 'publishing', color: '#ef4444', icon: '📢' },
        { name: 'Operations', nameAr: 'العمليات', slug: 'operations', color: '#6366f1', icon: '⚙️' },
    ];

    const departments: Record<string, any> = {};
    for (const d of deptDefs) {
        departments[d.slug] = await prisma.department.create({
            data: { ...d, organizationId: org.id },
        });
    }
    console.log(`  ✅ ${deptDefs.length} departments created`);

    // ═══════════════════════════════════════════════════════════
    // 3. POSITIONS CATALOG
    // ═══════════════════════════════════════════════════════════
    const positionDefs = [
        // Executive
        { title: 'Chief Executive Officer', titleAr: 'الرئيس التنفيذي', category: 'executive', level: 4, isDefault: true },
        { title: 'Chief Operating Officer', titleAr: 'مدير العمليات', category: 'executive', level: 4, isDefault: true },
        // Client / Account
        { title: 'Account Director', titleAr: 'مدير الحسابات', category: 'client', level: 3, isDefault: true },
        { title: 'Senior Account Manager', titleAr: 'مدير حسابات أول', category: 'client', level: 2, isDefault: true },
        { title: 'Account Manager', titleAr: 'مدير حسابات', category: 'client', level: 2, isDefault: true },
        // Marketing
        { title: 'Marketing Director', titleAr: 'مدير التسويق', category: 'marketing', level: 3, isDefault: true },
        { title: 'Marketing Manager', titleAr: 'مدير تسويق', category: 'marketing', level: 2, isDefault: true },
        { title: 'Content Strategist', titleAr: 'استراتيجي محتوى', category: 'marketing', level: 1, isDefault: true },
        { title: 'Social Media Manager', titleAr: 'مدير سوشيال ميديا', category: 'marketing', level: 1, isDefault: true },
        { title: 'Performance Marketer', titleAr: 'مسوّق أداء', category: 'marketing', level: 1, isDefault: true },
        { title: 'Media Buyer', titleAr: 'مشتري إعلانات', category: 'marketing', level: 1, isDefault: true },
        { title: 'Community Manager', titleAr: 'مدير مجتمع', category: 'marketing', level: 1, isDefault: true },
        // Creative
        { title: 'Creative Director', titleAr: 'المدير الإبداعي', category: 'creative', level: 3, isDefault: true },
        { title: 'Art Director', titleAr: 'المدير الفني', category: 'creative', level: 2, isDefault: true },
        { title: 'Senior Designer', titleAr: 'مصمم أول', category: 'creative', level: 1, isDefault: true },
        { title: 'Graphic Designer', titleAr: 'مصمم جرافيك', category: 'creative', level: 0, isDefault: true },
        { title: 'Copywriter', titleAr: 'كاتب محتوى', category: 'creative', level: 0, isDefault: true },
        // Production
        { title: 'Production Manager', titleAr: 'مدير الإنتاج', category: 'production', level: 2, isDefault: true },
        { title: 'Production Coordinator', titleAr: 'منسق إنتاج', category: 'production', level: 1, isDefault: true },
        { title: 'Videographer', titleAr: 'مصور فيديو', category: 'production', level: 0, isDefault: true },
        { title: 'Photographer', titleAr: 'مصور فوتوغرافي', category: 'production', level: 0, isDefault: true },
        { title: 'Editor', titleAr: 'مونتير', category: 'production', level: 0, isDefault: true },
        { title: 'Motion Designer', titleAr: 'مصمم موشن', category: 'production', level: 0, isDefault: true },
        // Publishing
        { title: 'Publishing Manager', titleAr: 'مدير النشر', category: 'publishing', level: 2, isDefault: true },
        { title: 'Publisher', titleAr: 'ناشر', category: 'publishing', level: 0, isDefault: true },
        { title: 'QA / Traffic Coordinator', titleAr: 'منسق جودة', category: 'publishing', level: 1, isDefault: true },
        // Admin
        { title: 'System Administrator', titleAr: 'مدير النظام', category: 'admin', level: 3, isDefault: true },
        { title: 'Operations Administrator', titleAr: 'مدير العمليات التشغيلية', category: 'admin', level: 2, isDefault: true },
    ];

    const positions: Record<string, any> = {};
    for (const p of positionDefs) {
        positions[p.title] = await prisma.position.create({ data: p });
    }
    console.log(`  ✅ ${positionDefs.length} positions created`);

    // ═══════════════════════════════════════════════════════════
    // 4. ROLES & PERMISSIONS
    // ═══════════════════════════════════════════════════════════
    const permissionDefs = [
        // Settings
        { code: 'settings.view', name: 'View Settings', nameAr: 'عرض الإعدادات', module: 'settings', category: 'view' },
        { code: 'settings.manage', name: 'Manage Settings', nameAr: 'إدارة الإعدادات', module: 'settings', category: 'manage' },
        { code: 'settings.users.manage', name: 'Manage Users', nameAr: 'إدارة المستخدمين', module: 'settings', category: 'manage' },
        { code: 'settings.roles.manage', name: 'Manage Roles', nameAr: 'إدارة الأدوار', module: 'settings', category: 'manage' },
        { code: 'settings.departments.manage', name: 'Manage Departments', nameAr: 'إدارة الأقسام', module: 'settings', category: 'manage' },
        { code: 'settings.integrations.manage', name: 'Manage Integrations', nameAr: 'إدارة التكاملات', module: 'settings', category: 'manage' },
        // Boards
        { code: 'marketing.view', name: 'View Marketing', nameAr: 'عرض التسويق', module: 'marketing', category: 'view' },
        { code: 'marketing.manage', name: 'Manage Marketing', nameAr: 'إدارة التسويق', module: 'marketing', category: 'manage' },
        { code: 'creative.view', name: 'View Creative', nameAr: 'عرض الإبداعي', module: 'creative', category: 'view' },
        { code: 'creative.manage', name: 'Manage Creative', nameAr: 'إدارة الإبداعي', module: 'creative', category: 'manage' },
        { code: 'production.view', name: 'View Production', nameAr: 'عرض الإنتاج', module: 'production', category: 'view' },
        { code: 'production.manage', name: 'Manage Production', nameAr: 'إدارة الإنتاج', module: 'production', category: 'manage' },
        { code: 'publishing.view', name: 'View Publishing', nameAr: 'عرض النشر', module: 'publishing', category: 'view' },
        { code: 'publishing.manage', name: 'Manage Publishing', nameAr: 'إدارة النشر', module: 'publishing', category: 'manage' },
        // Clients
        { code: 'clients.view', name: 'View Clients', nameAr: 'عرض العملاء', module: 'clients', category: 'view' },
        { code: 'clients.manage', name: 'Manage Clients', nameAr: 'إدارة العملاء', module: 'clients', category: 'manage' },
        // Reports
        { code: 'reports.view', name: 'View Reports', nameAr: 'عرض التقارير', module: 'reports', category: 'view' },
        { code: 'reports.export', name: 'Export Reports', nameAr: 'تصدير التقارير', module: 'reports', category: 'export' },
        // Approvals
        { code: 'approvals.concept_preliminary', name: 'Approve Concept (Preliminary)', nameAr: 'موافقة أولية على المفهوم', module: 'approvals', category: 'approve' },
        { code: 'approvals.concept_final', name: 'Approve Concept (Final)', nameAr: 'موافقة نهائية على المفهوم', module: 'approvals', category: 'approve' },
        { code: 'approvals.export', name: 'Approve Exports', nameAr: 'موافقة على التصدير', module: 'approvals', category: 'approve' },
        { code: 'approvals.publishing', name: 'Approve Publishing', nameAr: 'موافقة على النشر', module: 'approvals', category: 'approve' },
        { code: 'approvals.unblock', name: 'Unblock Workflow', nameAr: 'إلغاء حظر سير العمل', module: 'approvals', category: 'approve' },
    ];

    const permissions: Record<string, any> = {};
    for (const p of permissionDefs) {
        permissions[p.code] = await prisma.permission.create({ data: p });
    }
    console.log(`  ✅ ${permissionDefs.length} permissions created`);

    // Roles
    const roleDefs = [
        { name: 'ceo', nameAr: 'الرئيس التنفيذي', description: 'Full platform access', descriptionAr: 'صلاحيات كاملة للمنصة', scope: 'platform', isSystem: true },
        { name: 'coo', nameAr: 'مدير العمليات', description: 'Operations oversight', descriptionAr: 'إشراف على العمليات', scope: 'platform', isSystem: true },
        { name: 'admin', nameAr: 'مدير النظام', description: 'System administration', descriptionAr: 'إدارة النظام', scope: 'platform', isSystem: true },
        { name: 'department_head', nameAr: 'رئيس قسم', description: 'Department management', descriptionAr: 'إدارة القسم', scope: 'department', isSystem: true },
        { name: 'account_manager', nameAr: 'مدير حسابات', description: 'Client account management', descriptionAr: 'إدارة حسابات العملاء', scope: 'platform', isSystem: true },
        { name: 'marketing_manager', nameAr: 'مدير تسويق', description: 'Marketing department lead', descriptionAr: 'مسؤول قسم التسويق', scope: 'department', isSystem: false },
        { name: 'creative_director', nameAr: 'المدير الإبداعي', description: 'Creative department lead', descriptionAr: 'مسؤول القسم الإبداعي', scope: 'department', isSystem: false },
        { name: 'production_manager', nameAr: 'مدير الإنتاج', description: 'Production department lead', descriptionAr: 'مسؤول قسم الإنتاج', scope: 'department', isSystem: false },
        { name: 'publishing_manager', nameAr: 'مدير النشر', description: 'Publishing department lead', descriptionAr: 'مسؤول قسم النشر', scope: 'department', isSystem: false },
        { name: 'staff', nameAr: 'موظف', description: 'Regular team member', descriptionAr: 'عضو فريق عادي', scope: 'department', isSystem: true },
        { name: 'reviewer', nameAr: 'مراجع', description: 'Can review and comment', descriptionAr: 'يمكنه المراجعة والتعليق', scope: 'department', isSystem: false },
        { name: 'viewer', nameAr: 'مشاهد', description: 'Read-only access', descriptionAr: 'عرض فقط', scope: 'department', isSystem: true },
    ];

    const roles: Record<string, any> = {};
    for (const r of roleDefs) {
        roles[r.name] = await prisma.role.create({ data: r });
    }
    console.log(`  ✅ ${roleDefs.length} roles created`);

    // Assign ALL permissions to CEO & Admin
    const allPermCodes = Object.keys(permissions);
    for (const code of allPermCodes) {
        await prisma.rolePermission.create({ data: { roleId: roles['ceo'].id, permissionId: permissions[code].id } });
        await prisma.rolePermission.create({ data: { roleId: roles['admin'].id, permissionId: permissions[code].id } });
    }
    // COO gets everything except settings.roles.manage
    for (const code of allPermCodes.filter(c => c !== 'settings.roles.manage')) {
        await prisma.rolePermission.create({ data: { roleId: roles['coo'].id, permissionId: permissions[code].id } });
    }
    // Account Manager
    for (const code of ['marketing.view', 'creative.view', 'production.view', 'publishing.view', 'clients.view', 'clients.manage', 'reports.view', 'reports.export', 'approvals.concept_final']) {
        await prisma.rolePermission.create({ data: { roleId: roles['account_manager'].id, permissionId: permissions[code].id } });
    }
    // Department Head
    for (const code of ['clients.view', 'reports.view', 'reports.export']) {
        await prisma.rolePermission.create({ data: { roleId: roles['department_head'].id, permissionId: permissions[code].id } });
    }
    // Creative Director
    for (const code of ['creative.view', 'creative.manage', 'clients.view', 'reports.view', 'approvals.concept_preliminary', 'approvals.unblock']) {
        await prisma.rolePermission.create({ data: { roleId: roles['creative_director'].id, permissionId: permissions[code].id } });
    }
    // Marketing Manager
    for (const code of ['marketing.view', 'marketing.manage', 'clients.view', 'clients.manage', 'reports.view', 'reports.export']) {
        await prisma.rolePermission.create({ data: { roleId: roles['marketing_manager'].id, permissionId: permissions[code].id } });
    }
    // Production Manager
    for (const code of ['production.view', 'production.manage', 'clients.view', 'reports.view']) {
        await prisma.rolePermission.create({ data: { roleId: roles['production_manager'].id, permissionId: permissions[code].id } });
    }
    // Publishing Manager
    for (const code of ['publishing.view', 'publishing.manage', 'clients.view', 'approvals.publishing']) {
        await prisma.rolePermission.create({ data: { roleId: roles['publishing_manager'].id, permissionId: permissions[code].id } });
    }
    // Staff — department-scoped view only
    for (const code of ['clients.view', 'reports.view']) {
        await prisma.rolePermission.create({ data: { roleId: roles['staff'].id, permissionId: permissions[code].id } });
    }
    // Viewer
    await prisma.rolePermission.create({ data: { roleId: roles['viewer'].id, permissionId: permissions['clients.view'].id } });

    console.log('  ✅ Role-permission mappings created');

    // ═══════════════════════════════════════════════════════════
    // 5. USERS & PROFILES
    // ═══════════════════════════════════════════════════════════
    const userDefs = [
        { email: 'mustafa@remark.iq', fullName: 'مصطفى خلف', fullNameAr: 'مصطفى خلف', displayName: 'Mustafa Khalaf', displayNameAr: 'مصطفى', position: 'Chief Executive Officer', role: 'ceo', department: 'operations', avatar: 'م.خ', employeeCode: 'RMK-001' },
        { email: 'yousif@remark.iq', fullName: 'يوسف', fullNameAr: 'يوسف', displayName: 'Yousif', displayNameAr: 'يوسف', position: 'Chief Operating Officer', role: 'coo', department: 'operations', avatar: 'ي', employeeCode: 'RMK-002' },
        { email: 'saif@remark.iq', fullName: 'سيف', fullNameAr: 'سيف', displayName: 'Saif', displayNameAr: 'سيف', position: 'Account Manager', role: 'account_manager', department: 'operations', avatar: 'س', employeeCode: 'RMK-003' },
        { email: 'wedyan@remark.iq', fullName: 'وديان', fullNameAr: 'وديان', displayName: 'Wedyan', displayNameAr: 'وديان', position: 'Account Manager', role: 'account_manager', department: 'operations', avatar: 'و', employeeCode: 'RMK-004' },
        { email: 'ahmed@remark.iq', fullName: 'أحمد', fullNameAr: 'أحمد', displayName: 'Ahmed', displayNameAr: 'أحمد', position: 'Creative Director', role: 'creative_director', department: 'creative', avatar: 'أ', employeeCode: 'RMK-005' },
        { email: 'abdullah@remark.iq', fullName: 'عبدالله', fullNameAr: 'عبدالله', displayName: 'Abdullah', displayNameAr: 'عبدالله', position: 'Graphic Designer', role: 'staff', department: 'creative', avatar: 'ع', employeeCode: 'RMK-006' },
        { email: 'mohammed@remark.iq', fullName: 'محمد', fullNameAr: 'محمد', displayName: 'Mohammed', displayNameAr: 'محمد', position: 'Copywriter', role: 'staff', department: 'creative', avatar: 'م', employeeCode: 'RMK-007' },
        { email: 'marketing@remark.iq', fullName: 'مدير التسويق', fullNameAr: 'مدير التسويق', displayName: 'Marketing Manager', displayNameAr: 'مدير التسويق', position: 'Marketing Manager', role: 'marketing_manager', department: 'marketing', avatar: 'ت', employeeCode: 'RMK-008' },
        { email: 'hassanin@remark.iq', fullName: 'حسنين', fullNameAr: 'حسنين', displayName: 'Hassanin', displayNameAr: 'حسنين', position: 'Production Manager', role: 'production_manager', department: 'production', avatar: 'ح', employeeCode: 'RMK-009' },
        { email: 'musa@remark.iq', fullName: 'موسى', fullNameAr: 'موسى', displayName: 'Musa', displayNameAr: 'موسى', position: 'Videographer', role: 'staff', department: 'production', avatar: 'م', employeeCode: 'RMK-010' },
        { email: 'social@remark.iq', fullName: 'أخصائي سوشيال', fullNameAr: 'أخصائي سوشيال', displayName: 'Social Specialist', displayNameAr: 'أخصائي سوشيال', position: 'Social Media Manager', role: 'staff', department: 'marketing', avatar: 'ش', employeeCode: 'RMK-011' },
        { email: 'ibrahim@remark.iq', fullName: 'إبراهيم', fullNameAr: 'إبراهيم', displayName: 'Ibrahim', displayNameAr: 'إبراهيم', position: 'Publisher', role: 'staff', department: 'publishing', avatar: 'إ', employeeCode: 'RMK-012' },
        { email: 'info@remark-agency.com', fullName: 'مدير النظام', fullNameAr: 'مدير النظام', displayName: 'System Admin', displayNameAr: 'مدير النظام', position: 'Chief Executive Officer', role: 'ceo', department: 'operations', avatar: 'RM', employeeCode: 'RMK-100' },
    ];

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    // Store user IDs keyed by email prefix for later reference
    const users: Record<string, any> = {};

    for (const u of userDefs) {
        const user = await prisma.user.create({ data: { email: u.email, password: hashedPassword, status: 'active' } });
        await prisma.userProfile.create({
            data: {
                userId: user.id,
                fullName: u.fullName,
                fullNameAr: u.fullNameAr,
                displayName: u.displayName,
                displayNameAr: u.displayNameAr,
                avatar: u.avatar,
                employeeCode: u.employeeCode,
                positionId: positions[u.position]?.id,
            },
        });
        await prisma.userRole.create({ data: { userId: user.id, roleId: roles[u.role].id, isPrimary: true } });
        await prisma.userDepartment.create({ data: { userId: user.id, departmentId: departments[u.department].id, isPrimary: true } });

        // Store by email prefix (e.g. "mustafa", "yousif", etc.)
        const emailPrefix = u.email.split('@')[0];
        users[emailPrefix] = user;
    }
    console.log(`  ✅ ${userDefs.length} users with profiles created`);

    // ═══════════════════════════════════════════════════════════
    // 6. APPROVAL POLICIES
    // ═══════════════════════════════════════════════════════════
    const approvalPolicies = [
        { name: 'Preliminary Concept Approval', nameAr: 'موافقة أولية على المفهوم', workflow: 'creative_concept', stage: 'concept_preliminary', description: 'Creative Director approves initial concept', descriptionAr: 'المدير الإبداعي يوافق على المفهوم الأولي' },
        { name: 'Final Concept Approval', nameAr: 'موافقة نهائية على المفهوم', workflow: 'creative_concept', stage: 'concept_final', description: 'Account Manager gives final concept approval', descriptionAr: 'مدير الحسابات يعطي الموافقة النهائية على المفهوم' },
        { name: 'Production Review', nameAr: 'مراجعة الإنتاج', workflow: 'production_review', stage: 'review', description: 'Production manager reviews deliverables', descriptionAr: 'مدير الإنتاج يراجع المخرجات' },
        { name: 'Publishing Approval', nameAr: 'موافقة النشر', workflow: 'publishing', stage: 'approval', description: 'Account Manager approves for publishing', descriptionAr: 'مدير الحسابات يوافق على النشر' },
    ];

    for (const ap of approvalPolicies) {
        await prisma.approvalPolicy.create({ data: ap });
    }
    console.log(`  ✅ ${approvalPolicies.length} approval policies created`);

    // ═══════════════════════════════════════════════════════════
    // 7. SAMPLE CLIENTS
    // ═══════════════════════════════════════════════════════════
    const clientDefs = [
        { name: 'الوردة', nameAr: 'الوردة', sector: 'Restaurants & Cafés', sectorAr: 'مطاعم ومقاهي', planType: 'شهرية', budget: '5,000', avatar: '🌹' },
        { name: 'ريحانة', nameAr: 'ريحانة', sector: 'Real Estate', sectorAr: 'عقارات', planType: 'سنوية', budget: '15,000', avatar: '🏠' },
        { name: 'كلفنك', nameAr: 'كلفنك', sector: 'Beauty & Personal Care', sectorAr: 'جمال وعناية', planType: 'شهرية', budget: '3,000', avatar: '💄' },
        { name: 'زمزم', nameAr: 'زمزم', sector: 'Real Estate', sectorAr: 'عقارات', planType: 'شهرية', budget: '8,000', avatar: '🏗️' },
    ];

    // Store client IDs keyed by name for later reference
    const clients: Record<string, any> = {};

    for (const c of clientDefs) {
        const client = await prisma.client.create({ data: c });
        clients[c.name] = client;
    }
    console.log(`  ✅ ${clientDefs.length} clients created`);

    // ═══════════════════════════════════════════════════════════
    // 8. SYSTEM SETTINGS
    // ═══════════════════════════════════════════════════════════
    const settingsDefs = [
        { category: 'general', key: 'company_name', value: 'Remark' },
        { category: 'general', key: 'company_name_ar', value: 'ريمارك' },
        { category: 'general', key: 'default_language', value: 'ar' },
        { category: 'general', key: 'timezone', value: 'Asia/Baghdad' },
        { category: 'notifications', key: 'email_enabled', value: 'false' },
        { category: 'notifications', key: 'deadline_alert_hours', value: '24' },
        { category: 'security', key: 'session_timeout_minutes', value: '480' },
        { category: 'security', key: 'max_login_attempts', value: '5' },
        { category: 'branding', key: 'primary_color', value: '#6366f1' },
        { category: 'branding', key: 'logo_url', value: '' },
    ];

    for (const s of settingsDefs) {
        await prisma.systemSetting.create({ data: { ...s, organizationId: org.id } });
    }
    console.log(`  ✅ ${settingsDefs.length} system settings created`);

    // ═══════════════════════════════════════════════════════════
    // 9. INTEGRATION SETTINGS
    // ═══════════════════════════════════════════════════════════
    const integrationDefs = [
        { name: 'openai', nameAr: 'OpenAI', provider: 'OpenAI', isEnabled: false, config: JSON.stringify({ apiKey: '', model: 'gpt-4' }) },
        { name: 'notebooklm', nameAr: 'NotebookLM', provider: 'Google', isEnabled: false, config: JSON.stringify({ projectId: '' }) },
        { name: 'storage', nameAr: 'التخزين السحابي', provider: 'Local', isEnabled: true, config: JSON.stringify({ type: 'local', path: './uploads' }) },
        { name: 'webhook', nameAr: 'Webhook', provider: '', isEnabled: false, config: JSON.stringify({ url: '', secret: '' }) },
    ];

    for (const i of integrationDefs) {
        await prisma.integrationSetting.create({ data: { ...i, organizationId: org.id } });
    }
    console.log(`  ✅ ${integrationDefs.length} integrations created`);

    // ═══════════════════════════════════════════════════════════
    // 10. INVOICES + INVOICE ITEMS + PAYMENTS
    // ═══════════════════════════════════════════════════════════
    const invoice1 = await prisma.invoice.create({
        data: {
            number: 'INV-2026-001',
            clientId: clients['الوردة'].id,
            status: 'paid',
            issueDate: new Date('2026-01-15'),
            dueDate: new Date('2026-02-15'),
            subtotal: 5000,
            taxRate: 0,
            taxAmount: 0,
            total: 5000,
            currency: 'USD',
            notes: 'Monthly marketing retainer - January 2026',
            notesAr: 'عقد التسويق الشهري - يناير 2026',
            paidAt: new Date('2026-02-10'),
            createdBy: users['saif'].id,
        },
    });
    await prisma.invoiceItem.createMany({
        data: [
            { invoiceId: invoice1.id, description: 'Social Media Management', descriptionAr: 'إدارة وسائل التواصل الاجتماعي', quantity: 1, rate: 3000, amount: 3000, sortOrder: 0 },
            { invoiceId: invoice1.id, description: 'Content Creation (15 posts)', descriptionAr: 'إنشاء المحتوى (15 منشور)', quantity: 15, rate: 100, amount: 1500, sortOrder: 1 },
            { invoiceId: invoice1.id, description: 'Monthly Report', descriptionAr: 'التقرير الشهري', quantity: 1, rate: 500, amount: 500, sortOrder: 2 },
        ],
    });
    await prisma.payment.create({
        data: {
            invoiceId: invoice1.id,
            amount: 5000,
            method: 'bank_transfer',
            reference: 'TRF-20260210-001',
            notes: 'تم الدفع بالكامل',
            paidAt: new Date('2026-02-10'),
            recordedBy: users['mustafa'].id,
        },
    });

    const invoice2 = await prisma.invoice.create({
        data: {
            number: 'INV-2026-002',
            clientId: clients['ريحانة'].id,
            status: 'sent',
            issueDate: new Date('2026-02-01'),
            dueDate: new Date('2026-03-01'),
            subtotal: 15000,
            taxRate: 0,
            taxAmount: 0,
            total: 15000,
            currency: 'USD',
            notes: 'Annual marketing package',
            notesAr: 'باقة التسويق السنوية',
            sentAt: new Date('2026-02-02'),
            createdBy: users['wedyan'].id,
        },
    });
    await prisma.invoiceItem.createMany({
        data: [
            { invoiceId: invoice2.id, description: 'Annual Marketing Strategy', descriptionAr: 'استراتيجية التسويق السنوية', quantity: 1, rate: 5000, amount: 5000, sortOrder: 0 },
            { invoiceId: invoice2.id, description: 'Brand Identity Refresh', descriptionAr: 'تحديث الهوية البصرية', quantity: 1, rate: 4000, amount: 4000, sortOrder: 1 },
            { invoiceId: invoice2.id, description: 'Social Media Management (12 months)', descriptionAr: 'إدارة السوشيال ميديا (12 شهر)', quantity: 12, rate: 500, amount: 6000, sortOrder: 2 },
        ],
    });
    // Partial payment
    await prisma.payment.create({
        data: {
            invoiceId: invoice2.id,
            amount: 5000,
            method: 'bank_transfer',
            reference: 'TRF-20260215-002',
            notes: 'دفعة أولى',
            paidAt: new Date('2026-02-15'),
            recordedBy: users['mustafa'].id,
        },
    });

    const invoice3 = await prisma.invoice.create({
        data: {
            number: 'INV-2026-003',
            clientId: clients['كلفنك'].id,
            status: 'overdue',
            issueDate: new Date('2026-01-20'),
            dueDate: new Date('2026-02-20'),
            subtotal: 3000,
            taxRate: 0,
            taxAmount: 0,
            total: 3000,
            currency: 'USD',
            notes: 'Monthly retainer - January',
            notesAr: 'الاشتراك الشهري - يناير',
            createdBy: users['saif'].id,
        },
    });
    await prisma.invoiceItem.createMany({
        data: [
            { invoiceId: invoice3.id, description: 'Social Media Package', descriptionAr: 'باقة السوشيال ميديا', quantity: 1, rate: 2000, amount: 2000, sortOrder: 0 },
            { invoiceId: invoice3.id, description: 'Photography Session', descriptionAr: 'جلسة تصوير', quantity: 1, rate: 1000, amount: 1000, sortOrder: 1 },
        ],
    });

    const invoice4 = await prisma.invoice.create({
        data: {
            number: 'INV-2026-004',
            clientId: clients['زمزم'].id,
            status: 'draft',
            issueDate: new Date('2026-03-01'),
            dueDate: new Date('2026-04-01'),
            subtotal: 8000,
            taxRate: 0,
            taxAmount: 0,
            total: 8000,
            currency: 'USD',
            notes: 'March campaign package',
            notesAr: 'باقة حملة مارس',
            createdBy: users['wedyan'].id,
        },
    });
    await prisma.invoiceItem.createMany({
        data: [
            { invoiceId: invoice4.id, description: 'Video Production (3 videos)', descriptionAr: 'إنتاج فيديو (3 فيديوهات)', quantity: 3, rate: 1500, amount: 4500, sortOrder: 0 },
            { invoiceId: invoice4.id, description: 'Paid Ads Management', descriptionAr: 'إدارة الإعلانات المدفوعة', quantity: 1, rate: 2000, amount: 2000, sortOrder: 1 },
            { invoiceId: invoice4.id, description: 'Design Package', descriptionAr: 'باقة التصميم', quantity: 1, rate: 1500, amount: 1500, sortOrder: 2 },
        ],
    });

    const invoice5 = await prisma.invoice.create({
        data: {
            number: 'INV-2026-005',
            clientId: clients['الوردة'].id,
            status: 'sent',
            issueDate: new Date('2026-02-15'),
            dueDate: new Date('2026-03-15'),
            subtotal: 5000,
            taxRate: 0,
            taxAmount: 0,
            total: 5000,
            currency: 'USD',
            notes: 'Monthly marketing retainer - February 2026',
            notesAr: 'عقد التسويق الشهري - فبراير 2026',
            sentAt: new Date('2026-02-16'),
            createdBy: users['saif'].id,
        },
    });
    await prisma.invoiceItem.createMany({
        data: [
            { invoiceId: invoice5.id, description: 'Social Media Management', descriptionAr: 'إدارة وسائل التواصل الاجتماعي', quantity: 1, rate: 3000, amount: 3000, sortOrder: 0 },
            { invoiceId: invoice5.id, description: 'Content Creation (15 posts)', descriptionAr: 'إنشاء المحتوى (15 منشور)', quantity: 15, rate: 100, amount: 1500, sortOrder: 1 },
            { invoiceId: invoice5.id, description: 'Monthly Report', descriptionAr: 'التقرير الشهري', quantity: 1, rate: 500, amount: 500, sortOrder: 2 },
        ],
    });

    console.log('  ✅ 5 invoices with items and payments created');

    // ═══════════════════════════════════════════════════════════
    // 11. EXPENSES
    // ═══════════════════════════════════════════════════════════
    await prisma.expense.create({
        data: {
            category: 'software',
            description: 'Adobe Creative Cloud - Annual License',
            descriptionAr: 'أدوبي كريتيف كلاود - ترخيص سنوي',
            amount: 3600,
            currency: 'USD',
            date: new Date('2026-01-10'),
            status: 'approved',
            approvedBy: users['mustafa'].id,
            createdBy: users['ahmed'].id,
        },
    });
    await prisma.expense.create({
        data: {
            category: 'equipment',
            description: 'Camera Lens - Sony 24-70mm f/2.8',
            descriptionAr: 'عدسة كاميرا - سوني 24-70 مم',
            amount: 2200,
            currency: 'USD',
            date: new Date('2026-01-25'),
            status: 'approved',
            approvedBy: users['yousif'].id,
            createdBy: users['hassanin'].id,
        },
    });
    await prisma.expense.create({
        data: {
            category: 'marketing',
            description: 'Facebook Ads - الوردة Campaign',
            descriptionAr: 'إعلانات فيسبوك - حملة الوردة',
            amount: 1500,
            currency: 'USD',
            date: new Date('2026-02-01'),
            clientId: clients['الوردة'].id,
            status: 'approved',
            approvedBy: users['mustafa'].id,
            createdBy: users['marketing'].id,
        },
    });
    await prisma.expense.create({
        data: {
            category: 'travel',
            description: 'Client Meeting - Erbil Trip',
            descriptionAr: 'اجتماع عميل - سفر أربيل',
            amount: 450,
            currency: 'USD',
            date: new Date('2026-02-15'),
            status: 'pending',
            createdBy: users['saif'].id,
        },
    });
    await prisma.expense.create({
        data: {
            category: 'freelancer',
            description: 'Freelance Voice Over Artist',
            descriptionAr: 'فنان تعليق صوتي مستقل',
            amount: 300,
            currency: 'USD',
            date: new Date('2026-02-20'),
            clientId: clients['زمزم'].id,
            status: 'approved',
            approvedBy: users['yousif'].id,
            createdBy: users['hassanin'].id,
        },
    });
    await prisma.expense.create({
        data: {
            category: 'office',
            description: 'Office Supplies - Printing Materials',
            descriptionAr: 'مستلزمات مكتبية - مواد طباعة',
            amount: 180,
            currency: 'USD',
            date: new Date('2026-03-01'),
            status: 'pending',
            createdBy: users['yousif'].id,
        },
    });

    console.log('  ✅ 6 expenses created');

    // ═══════════════════════════════════════════════════════════
    // 12. BUDGETS
    // ═══════════════════════════════════════════════════════════
    await prisma.budget.create({
        data: {
            clientId: clients['الوردة'].id,
            name: 'الوردة - Monthly Marketing Budget',
            nameAr: 'الوردة - ميزانية التسويق الشهرية',
            allocated: 5000,
            spent: 4500,
            period: 'monthly',
            startDate: new Date('2026-03-01'),
            endDate: new Date('2026-03-31'),
            status: 'active',
        },
    });
    await prisma.budget.create({
        data: {
            clientId: clients['ريحانة'].id,
            name: 'ريحانة - Annual Brand Campaign',
            nameAr: 'ريحانة - حملة العلامة التجارية السنوية',
            allocated: 15000,
            spent: 5000,
            period: 'yearly',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
            status: 'active',
        },
    });
    await prisma.budget.create({
        data: {
            clientId: clients['زمزم'].id,
            name: 'زمزم - Q1 Video Production',
            nameAr: 'زمزم - إنتاج فيديو الربع الأول',
            allocated: 8000,
            spent: 6200,
            period: 'quarterly',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-03-31'),
            status: 'active',
        },
    });

    console.log('  ✅ 3 budgets created');

    // ═══════════════════════════════════════════════════════════
    // 13. TIME ENTRIES
    // ═══════════════════════════════════════════════════════════
    await prisma.timeEntry.create({
        data: {
            userId: users['ahmed'].id,
            clientId: clients['الوردة'].id,
            taskType: 'creative_request',
            description: 'Logo concept sketches for الوردة',
            descriptionAr: 'رسومات أولية لشعار الوردة',
            startTime: new Date('2026-03-03T09:00:00'),
            endTime: new Date('2026-03-03T12:30:00'),
            duration: 210,
            billable: true,
            rate: 50,
            status: 'completed',
        },
    });
    await prisma.timeEntry.create({
        data: {
            userId: users['abdullah'].id,
            clientId: clients['الوردة'].id,
            taskType: 'creative_request',
            description: 'Social media post designs',
            descriptionAr: 'تصميم منشورات السوشيال ميديا',
            startTime: new Date('2026-03-03T10:00:00'),
            endTime: new Date('2026-03-03T14:00:00'),
            duration: 240,
            billable: true,
            rate: 35,
            status: 'completed',
        },
    });
    await prisma.timeEntry.create({
        data: {
            userId: users['mohammed'].id,
            clientId: clients['ريحانة'].id,
            taskType: 'creative_request',
            description: 'Copywriting for real estate brochure',
            descriptionAr: 'كتابة محتوى بروشور عقاري',
            startTime: new Date('2026-03-04T08:30:00'),
            endTime: new Date('2026-03-04T11:30:00'),
            duration: 180,
            billable: true,
            rate: 40,
            status: 'completed',
        },
    });
    await prisma.timeEntry.create({
        data: {
            userId: users['musa'].id,
            clientId: clients['زمزم'].id,
            taskType: 'production_job',
            description: 'Property video shoot - زمزم project',
            descriptionAr: 'تصوير فيديو مشروع زمزم',
            startTime: new Date('2026-03-05T07:00:00'),
            endTime: new Date('2026-03-05T15:00:00'),
            duration: 480,
            billable: true,
            rate: 45,
            status: 'completed',
        },
    });
    await prisma.timeEntry.create({
        data: {
            userId: users['hassanin'].id,
            clientId: clients['زمزم'].id,
            taskType: 'production_job',
            description: 'Video editing and color grading',
            descriptionAr: 'مونتاج فيديو وتصحيح ألوان',
            startTime: new Date('2026-03-06T09:00:00'),
            endTime: new Date('2026-03-06T17:00:00'),
            duration: 480,
            billable: true,
            rate: 50,
            status: 'completed',
        },
    });
    await prisma.timeEntry.create({
        data: {
            userId: users['social'].id,
            clientId: clients['كلفنك'].id,
            taskType: 'marketing_task',
            description: 'Social media scheduling and engagement',
            descriptionAr: 'جدولة وتفاعل على السوشيال ميديا',
            startTime: new Date('2026-03-07T09:00:00'),
            endTime: new Date('2026-03-07T13:00:00'),
            duration: 240,
            billable: true,
            rate: 30,
            status: 'completed',
        },
    });
    await prisma.timeEntry.create({
        data: {
            userId: users['marketing'].id,
            clientId: clients['الوردة'].id,
            taskType: 'marketing_task',
            description: 'Campaign strategy meeting and planning',
            descriptionAr: 'اجتماع استراتيجية الحملة والتخطيط',
            startTime: new Date('2026-03-08T10:00:00'),
            endTime: new Date('2026-03-08T12:00:00'),
            duration: 120,
            billable: true,
            rate: 60,
            status: 'completed',
        },
    });
    await prisma.timeEntry.create({
        data: {
            userId: users['saif'].id,
            clientId: clients['ريحانة'].id,
            taskType: 'general',
            description: 'Client presentation and review meeting',
            descriptionAr: 'عرض تقديمي واجتماع مراجعة مع العميل',
            startTime: new Date('2026-03-09T14:00:00'),
            endTime: new Date('2026-03-09T16:00:00'),
            duration: 120,
            billable: false,
            rate: 0,
            status: 'completed',
        },
    });
    await prisma.timeEntry.create({
        data: {
            userId: users['ibrahim'].id,
            clientId: clients['الوردة'].id,
            taskType: 'publishing_item',
            description: 'Content publishing and QA check',
            descriptionAr: 'نشر المحتوى وفحص الجودة',
            startTime: new Date('2026-03-10T08:00:00'),
            endTime: new Date('2026-03-10T10:30:00'),
            duration: 150,
            billable: true,
            rate: 30,
            status: 'completed',
        },
    });
    await prisma.timeEntry.create({
        data: {
            userId: users['wedyan'].id,
            clientId: clients['كلفنك'].id,
            taskType: 'general',
            description: 'Account management and client coordination',
            descriptionAr: 'إدارة الحساب والتنسيق مع العميل',
            startTime: new Date('2026-03-10T11:00:00'),
            endTime: new Date('2026-03-10T13:00:00'),
            duration: 120,
            billable: false,
            rate: 0,
            status: 'completed',
        },
    });

    console.log('  ✅ 10 time entries created');

    // ═══════════════════════════════════════════════════════════
    // 14. CALENDAR EVENTS + ATTENDEES
    // ═══════════════════════════════════════════════════════════
    const event1 = await prisma.calendarEvent.create({
        data: {
            title: 'Weekly Team Standup',
            titleAr: 'اجتماع الفريق الأسبوعي',
            description: 'Weekly sync across all departments',
            type: 'meeting',
            startAt: new Date('2026-03-10T09:00:00'),
            endAt: new Date('2026-03-10T09:30:00'),
            allDay: false,
            location: 'المكتب الرئيسي - قاعة الاجتماعات',
            createdBy: users['mustafa'].id,
            isRecurring: true,
            recurRule: 'RRULE:FREQ=WEEKLY;BYDAY=SU',
        },
    });
    await prisma.calendarAttendee.createMany({
        data: [
            { eventId: event1.id, userId: users['mustafa'].id, status: 'accepted' },
            { eventId: event1.id, userId: users['yousif'].id, status: 'accepted' },
            { eventId: event1.id, userId: users['ahmed'].id, status: 'accepted' },
            { eventId: event1.id, userId: users['hassanin'].id, status: 'accepted' },
            { eventId: event1.id, userId: users['marketing'].id, status: 'accepted' },
        ],
    });

    const event2 = await prisma.calendarEvent.create({
        data: {
            title: 'الوردة - Content Review',
            titleAr: 'الوردة - مراجعة المحتوى',
            description: 'Monthly content review with client',
            type: 'review',
            startAt: new Date('2026-03-12T11:00:00'),
            endAt: new Date('2026-03-12T12:30:00'),
            allDay: false,
            location: 'Zoom Meeting',
            createdBy: users['saif'].id,
            clientId: clients['الوردة'].id,
        },
    });
    await prisma.calendarAttendee.createMany({
        data: [
            { eventId: event2.id, userId: users['saif'].id, status: 'accepted' },
            { eventId: event2.id, userId: users['ahmed'].id, status: 'accepted' },
            { eventId: event2.id, userId: users['social'].id, status: 'pending' },
        ],
    });

    const event3 = await prisma.calendarEvent.create({
        data: {
            title: 'زمزم - Property Shoot',
            titleAr: 'زمزم - تصوير المشروع العقاري',
            description: 'On-site property video and photo shoot',
            type: 'shoot',
            startAt: new Date('2026-03-15T07:00:00'),
            endAt: new Date('2026-03-15T16:00:00'),
            allDay: false,
            location: 'مشروع زمزم - بغداد',
            createdBy: users['hassanin'].id,
            clientId: clients['زمزم'].id,
        },
    });
    await prisma.calendarAttendee.createMany({
        data: [
            { eventId: event3.id, userId: users['hassanin'].id, status: 'accepted' },
            { eventId: event3.id, userId: users['musa'].id, status: 'accepted' },
            { eventId: event3.id, userId: users['wedyan'].id, status: 'tentative' },
        ],
    });

    const event4 = await prisma.calendarEvent.create({
        data: {
            title: 'Creative Brainstorm - ريحانة Rebrand',
            titleAr: 'جلسة عصف ذهني - إعادة علامة ريحانة',
            description: 'Brainstorming session for brand refresh',
            type: 'meeting',
            startAt: new Date('2026-03-13T14:00:00'),
            endAt: new Date('2026-03-13T16:00:00'),
            allDay: false,
            location: 'المكتب الرئيسي - غرفة الإبداع',
            createdBy: users['ahmed'].id,
            clientId: clients['ريحانة'].id,
        },
    });
    await prisma.calendarAttendee.createMany({
        data: [
            { eventId: event4.id, userId: users['ahmed'].id, status: 'accepted' },
            { eventId: event4.id, userId: users['abdullah'].id, status: 'accepted' },
            { eventId: event4.id, userId: users['mohammed'].id, status: 'accepted' },
            { eventId: event4.id, userId: users['wedyan'].id, status: 'accepted' },
        ],
    });

    const event5 = await prisma.calendarEvent.create({
        data: {
            title: 'Nowruz Holiday',
            titleAr: 'عطلة نوروز',
            description: 'Public holiday - office closed',
            type: 'holiday',
            startAt: new Date('2026-03-21T00:00:00'),
            endAt: new Date('2026-03-21T23:59:59'),
            allDay: true,
            createdBy: users['mustafa'].id,
        },
    });

    const event6 = await prisma.calendarEvent.create({
        data: {
            title: 'Invoice Payment Deadline - كلفنك',
            titleAr: 'موعد سداد الفاتورة - كلفنك',
            description: 'Overdue invoice follow-up',
            type: 'deadline',
            startAt: new Date('2026-03-11T10:00:00'),
            allDay: false,
            createdBy: users['saif'].id,
            clientId: clients['كلفنك'].id,
        },
    });
    await prisma.calendarAttendee.createMany({
        data: [
            { eventId: event6.id, userId: users['saif'].id, status: 'accepted' },
            { eventId: event6.id, userId: users['mustafa'].id, status: 'pending' },
        ],
    });

    console.log('  ✅ 6 calendar events with attendees created');

    // ═══════════════════════════════════════════════════════════
    // 15. CHAT ROOMS + MEMBERS + MESSAGES
    // ═══════════════════════════════════════════════════════════
    const room1 = await prisma.chatRoom.create({
        data: {
            name: 'General',
            nameAr: 'عام',
            type: 'company',
        },
    });
    await prisma.chatRoomMember.createMany({
        data: [
            { roomId: room1.id, userId: users['mustafa'].id, role: 'admin' },
            { roomId: room1.id, userId: users['yousif'].id, role: 'admin' },
            { roomId: room1.id, userId: users['saif'].id, role: 'member' },
            { roomId: room1.id, userId: users['wedyan'].id, role: 'member' },
            { roomId: room1.id, userId: users['ahmed'].id, role: 'member' },
            { roomId: room1.id, userId: users['hassanin'].id, role: 'member' },
            { roomId: room1.id, userId: users['marketing'].id, role: 'member' },
            { roomId: room1.id, userId: users['ibrahim'].id, role: 'member' },
        ],
    });
    await prisma.chatMessage.create({
        data: {
            roomId: room1.id,
            senderId: users['mustafa'].id,
            content: 'Good morning team! Reminder: weekly standup is at 9 AM tomorrow.',
            type: 'text',
        },
    });
    await prisma.chatMessage.create({
        data: {
            roomId: room1.id,
            senderId: users['yousif'].id,
            content: 'صباح الخير! لا تنسوا تحديث تقارير العملاء قبل نهاية الأسبوع.',
            type: 'text',
        },
    });
    await prisma.chatMessage.create({
        data: {
            roomId: room1.id,
            senderId: users['ahmed'].id,
            content: 'تم الانتهاء من تصاميم الوردة الجديدة، جاهزة للمراجعة!',
            type: 'text',
        },
    });

    const room2 = await prisma.chatRoom.create({
        data: {
            name: 'Creative Team',
            nameAr: 'فريق الإبداع',
            type: 'department',
            departmentId: departments['creative'].id,
        },
    });
    await prisma.chatRoomMember.createMany({
        data: [
            { roomId: room2.id, userId: users['ahmed'].id, role: 'admin' },
            { roomId: room2.id, userId: users['abdullah'].id, role: 'member' },
            { roomId: room2.id, userId: users['mohammed'].id, role: 'member' },
        ],
    });
    await prisma.chatMessage.create({
        data: {
            roomId: room2.id,
            senderId: users['ahmed'].id,
            content: 'يا شباب، محتاج تصاميم ريحانة تكون جاهزة يوم الخميس.',
            type: 'text',
        },
    });
    await prisma.chatMessage.create({
        data: {
            roomId: room2.id,
            senderId: users['abdullah'].id,
            content: 'إن شاء الله جاهزة. هل في ملاحظات على الألوان؟',
            type: 'text',
        },
    });
    await prisma.chatMessage.create({
        data: {
            roomId: room2.id,
            senderId: users['mohammed'].id,
            content: 'أنا خلصت النصوص لكل المنشورات، رح أرسلها على الشير.',
            type: 'text',
        },
    });
    await prisma.chatMessage.create({
        data: {
            roomId: room2.id,
            senderId: users['ahmed'].id,
            content: 'ممتاز! خلونا ننسق مع سيف على الجدول الزمني للعميل.',
            type: 'text',
        },
    });

    const room3 = await prisma.chatRoom.create({
        data: {
            name: 'Production Updates',
            nameAr: 'تحديثات الإنتاج',
            type: 'department',
            departmentId: departments['production'].id,
        },
    });
    await prisma.chatRoomMember.createMany({
        data: [
            { roomId: room3.id, userId: users['hassanin'].id, role: 'admin' },
            { roomId: room3.id, userId: users['musa'].id, role: 'member' },
        ],
    });
    await prisma.chatMessage.create({
        data: {
            roomId: room3.id,
            senderId: users['hassanin'].id,
            content: 'موسى، تصوير زمزم يوم الأحد الساعة 7 صباحاً. جهز المعدات.',
            type: 'text',
        },
    });
    await prisma.chatMessage.create({
        data: {
            roomId: room3.id,
            senderId: users['musa'].id,
            content: 'تمام، رح أجهز الكاميرا والدرون. هل نحتاج إضاءة إضافية؟',
            type: 'text',
        },
    });
    await prisma.chatMessage.create({
        data: {
            roomId: room3.id,
            senderId: users['hassanin'].id,
            content: 'نعم، خذ معاك الـ LED panel الكبير. الموقع داخلي وخارجي.',
            type: 'text',
        },
    });

    console.log('  ✅ 3 chat rooms with members and messages created');

    // ═══════════════════════════════════════════════════════════
    // 16. WIKI ARTICLES
    // ═══════════════════════════════════════════════════════════
    await prisma.wikiArticle.create({
        data: {
            title: 'Brand Guidelines Process',
            titleAr: 'عملية إرشادات العلامة التجارية',
            slug: 'brand-guidelines-process',
            content: 'This article outlines the standard process for creating and maintaining brand guidelines for our clients. The process includes: discovery, moodboard creation, initial concepts, revisions, and final delivery.',
            contentAr: 'يوضح هذا المقال العملية القياسية لإنشاء وصيانة إرشادات العلامة التجارية لعملائنا. تشمل العملية: الاكتشاف، إنشاء لوحة المزاج، المفاهيم الأولية، التعديلات، والتسليم النهائي.',
            category: 'process',
            tags: JSON.stringify(['branding', 'guidelines', 'process', 'design']),
            authorId: users['ahmed'].id,
            isPublished: true,
            viewCount: 42,
        },
    });
    await prisma.wikiArticle.create({
        data: {
            title: 'New Employee Onboarding',
            titleAr: 'تأهيل الموظف الجديد',
            slug: 'new-employee-onboarding',
            content: 'Welcome to Remark! This guide covers everything new team members need to know: tools access, communication channels, workflow processes, and team introductions.',
            contentAr: 'مرحباً بك في ريمارك! يغطي هذا الدليل كل ما يحتاج أعضاء الفريق الجدد معرفته: الوصول للأدوات، قنوات التواصل، عمليات سير العمل، والتعريف بالفريق.',
            category: 'onboarding',
            tags: JSON.stringify(['onboarding', 'hr', 'welcome', 'new-employee']),
            authorId: users['yousif'].id,
            isPublished: true,
            viewCount: 128,
        },
    });
    await prisma.wikiArticle.create({
        data: {
            title: 'Social Media Posting Template',
            titleAr: 'قالب نشر السوشيال ميديا',
            slug: 'social-media-posting-template',
            content: 'Standard template for social media posts across all platforms. Includes recommended image sizes, caption formats, hashtag strategies, and posting schedules.',
            contentAr: 'القالب القياسي لمنشورات السوشيال ميديا على جميع المنصات. يتضمن أحجام الصور الموصى بها، صيغ التعليقات، استراتيجيات الهاشتاغ، وجداول النشر.',
            category: 'template',
            tags: JSON.stringify(['social-media', 'template', 'posting', 'marketing']),
            authorId: users['marketing'].id,
            isPublished: true,
            viewCount: 85,
        },
    });
    await prisma.wikiArticle.create({
        data: {
            title: 'Video Production Checklist',
            titleAr: 'قائمة مراجعة إنتاج الفيديو',
            slug: 'video-production-checklist',
            content: 'Pre-production, production, and post-production checklists for video projects. Covers equipment preparation, shooting day protocols, editing workflow, and delivery standards.',
            contentAr: 'قوائم مراجعة ما قبل الإنتاج والإنتاج وما بعد الإنتاج لمشاريع الفيديو. تغطي تحضير المعدات، بروتوكولات يوم التصوير، سير عمل المونتاج، ومعايير التسليم.',
            category: 'process',
            tags: JSON.stringify(['video', 'production', 'checklist', 'workflow']),
            authorId: users['hassanin'].id,
            isPublished: true,
            viewCount: 63,
        },
    });

    console.log('  ✅ 4 wiki articles created');

    // ═══════════════════════════════════════════════════════════
    // 17. CONTACT LOGS
    // ═══════════════════════════════════════════════════════════
    await prisma.contactLog.create({
        data: {
            clientId: clients['الوردة'].id,
            userId: users['saif'].id,
            type: 'meeting',
            subject: 'Monthly performance review',
            subjectAr: 'مراجعة الأداء الشهري',
            notes: 'Discussed campaign results. Client satisfied with engagement metrics. Wants to increase ad spend next month.',
            outcome: 'positive',
            duration: 45,
        },
    });
    await prisma.contactLog.create({
        data: {
            clientId: clients['ريحانة'].id,
            userId: users['wedyan'].id,
            type: 'call',
            subject: 'Project timeline discussion',
            subjectAr: 'مناقشة الجدول الزمني للمشروع',
            notes: 'Client requested earlier delivery of brand guidelines. Agreed on new deadline of March 20.',
            outcome: 'follow_up_needed',
            followUpDate: new Date('2026-03-20'),
            duration: 20,
        },
    });
    await prisma.contactLog.create({
        data: {
            clientId: clients['كلفنك'].id,
            userId: users['saif'].id,
            type: 'whatsapp',
            subject: 'Invoice payment reminder',
            subjectAr: 'تذكير بسداد الفاتورة',
            notes: 'Sent payment reminder for overdue invoice INV-2026-003. Client mentioned processing within the week.',
            outcome: 'neutral',
            duration: 5,
        },
    });
    await prisma.contactLog.create({
        data: {
            clientId: clients['زمزم'].id,
            userId: users['wedyan'].id,
            type: 'visit',
            subject: 'Site visit for video shoot planning',
            subjectAr: 'زيارة موقع لتخطيط التصوير',
            notes: 'Visited the property site to plan upcoming video shoot. Identified 5 key shooting locations. Need to coordinate with security for access.',
            outcome: 'positive',
            duration: 90,
        },
    });
    await prisma.contactLog.create({
        data: {
            clientId: clients['الوردة'].id,
            userId: users['marketing'].id,
            type: 'email',
            subject: 'Campaign report delivery',
            subjectAr: 'تسليم تقرير الحملة',
            notes: 'Sent monthly campaign report with analytics breakdown. Awaiting client feedback.',
            outcome: 'neutral',
            duration: 10,
        },
    });

    console.log('  ✅ 5 contact logs created');

    // ═══════════════════════════════════════════════════════════
    // 18. LEAD SCORES
    // ═══════════════════════════════════════════════════════════
    await prisma.leadScore.create({
        data: {
            clientId: clients['الوردة'].id,
            score: 85,
            engagement: 90,
            budget: 75,
            urgency: 80,
            fit: 95,
        },
    });
    await prisma.leadScore.create({
        data: {
            clientId: clients['ريحانة'].id,
            score: 92,
            engagement: 85,
            budget: 95,
            urgency: 90,
            fit: 98,
        },
    });
    await prisma.leadScore.create({
        data: {
            clientId: clients['كلفنك'].id,
            score: 60,
            engagement: 55,
            budget: 50,
            urgency: 65,
            fit: 70,
        },
    });
    await prisma.leadScore.create({
        data: {
            clientId: clients['زمزم'].id,
            score: 78,
            engagement: 80,
            budget: 85,
            urgency: 70,
            fit: 75,
        },
    });

    console.log('  ✅ 4 lead scores created');

    // ═══════════════════════════════════════════════════════════
    // CAMPAIGNS
    // ═══════════════════════════════════════════════════════════
    const campaign1 = await prisma.campaign.create({
        data: { name: 'Al Warda Spring 2026', nameAr: 'حملة الوردة — ربيع 2026', description: 'Spring promotions campaign — حملة عروض الربيع', status: 'active', clientId: clients['الوردة'].id, startDate: new Date('2026-03-01'), endDate: new Date('2026-05-31'), budget: '5000' },
    });
    const campaign2 = await prisma.campaign.create({
        data: { name: 'Rayhana Phase 2 Launch', nameAr: 'إطلاق المرحلة الثانية — ريحانة', description: 'Real estate project launch — إطلاق مشروع عقاري', status: 'active', clientId: clients['ريحانة'].id, startDate: new Date('2026-03-10'), endDate: new Date('2026-06-30'), budget: '15000' },
    });
    const campaign3 = await prisma.campaign.create({
        data: { name: 'Kalfink Ramadan', nameAr: 'كلفنك — رمضان', description: 'Ramadan beauty campaign — حملة رمضان للجمال', status: 'planning', clientId: clients['كلفنك'].id, startDate: new Date('2026-03-15'), endDate: new Date('2026-04-15'), budget: '3000' },
    });
    const campaign4 = await prisma.campaign.create({
        data: { name: 'Zamzam Noor Project', nameAr: 'مشروع النور — زمزم', description: 'Noor real estate launch — إطلاق مشروع النور العقاري', status: 'active', clientId: clients['زمزم'].id, startDate: new Date('2026-02-01'), endDate: new Date('2026-04-30'), budget: '8000' },
    });
    console.log('  ✅ 4 campaigns created');

    // ═══════════════════════════════════════════════════════════
    // MARKETING TASKS
    // ═══════════════════════════════════════════════════════════
    const mTasks = [
        { title: 'Monthly Content Plan — Al Warda', titleAr: 'خطة محتوى مارس — الوردة', status: 'in_progress', priority: 'high', clientId: clients['الوردة'].id, campaignId: campaign1.id, assigneeId: users['marketing'].id, dueDate: new Date('2026-03-05'), description: 'خطة المحتوى الشهرية' },
        { title: 'Competitor Analysis — Al Warda', titleAr: 'تحليل المنافسين — الوردة', status: 'completed', priority: 'medium', clientId: clients['الوردة'].id, campaignId: campaign1.id, assigneeId: users['social'].id, dueDate: new Date('2026-03-03'), description: 'تحليل المنافسين' },
        { title: 'Ad Strategy — Rayhana Phase 2', titleAr: 'استراتيجية إعلانات — ريحانة', status: 'in_progress', priority: 'urgent', clientId: clients['ريحانة'].id, campaignId: campaign2.id, assigneeId: users['marketing'].id, dueDate: new Date('2026-03-12'), description: 'استراتيجية إعلانية للمرحلة الثانية' },
        { title: 'Ramadan Plan — Kalfink', titleAr: 'خطة رمضان — كلفنك', status: 'pending', priority: 'high', clientId: clients['كلفنك'].id, campaignId: campaign3.id, assigneeId: users['marketing'].id, dueDate: new Date('2026-03-10'), description: 'خطة حملة رمضان' },
        { title: 'Feb Performance Report — Al Warda', titleAr: 'تقرير أداء فبراير — الوردة', status: 'completed', priority: 'medium', clientId: clients['الوردة'].id, campaignId: campaign1.id, assigneeId: users['social'].id, dueDate: new Date('2026-03-01'), description: 'تقرير أداء فبراير' },
        { title: 'Noor Launch Campaign — Zamzam', titleAr: 'حملة إطلاق النور — زمزم', status: 'in_progress', priority: 'urgent', clientId: clients['زمزم'].id, campaignId: campaign4.id, assigneeId: users['saif'].id, dueDate: new Date('2026-03-15'), description: 'حملة إطلاق مشروع النور' },
    ];
    for (const t of mTasks) await prisma.marketingTask.create({ data: t });
    console.log(`  ✅ ${mTasks.length} marketing tasks created`);

    // ═══════════════════════════════════════════════════════════
    // CREATIVE REQUESTS
    // ═══════════════════════════════════════════════════════════
    const cReqs = [
        { title: 'Lunch Promo Post — Al Warda', titleAr: 'بوست ترويجي — عرض الغداء', category: 'social_post', status: 'in_progress', priority: 'high', clientId: clients['الوردة'].id, campaignId: campaign1.id, platform: 'Instagram', format: '1080x1080', brief: 'بوست ترويجي لعرض الغداء', executorId: users['abdullah'].id, conceptWriterId: users['ahmed'].id, dueDate: new Date('2026-03-08'), conceptApproved: true, finalApproved: false },
        { title: 'Kitchen BTS Reel — Al Warda', titleAr: 'ريلز المطبخ — خلف الكواليس', category: 'reel', status: 'review', priority: 'medium', clientId: clients['الوردة'].id, campaignId: campaign1.id, platform: 'Instagram', format: '1080x1920', brief: 'ريلز خلف الكواليس للمطبخ', executorId: users['hassanin'].id, conceptWriterId: users['ahmed'].id, dueDate: new Date('2026-03-10'), conceptApproved: true, finalApproved: false },
        { title: 'Phase 2 Tour Video — Rayhana', titleAr: 'فيديو جولة — المرحلة الثانية', category: 'video', status: 'in_progress', priority: 'urgent', clientId: clients['ريحانة'].id, campaignId: campaign2.id, platform: 'Instagram', format: '1080x1920', brief: 'فيديو جولة للمرحلة الثانية', executorId: users['hassanin'].id, conceptWriterId: users['ahmed'].id, dueDate: new Date('2026-03-14'), conceptApproved: false, finalApproved: false },
        { title: 'Noor Launch Ad — Zamzam', titleAr: 'إعلان إطلاق مشروع النور', category: 'video', status: 'new_request', priority: 'urgent', clientId: clients['زمزم'].id, campaignId: campaign4.id, platform: 'Instagram', format: '1080x1920', brief: 'إعلان إطلاق مشروع النور', executorId: users['abdullah'].id, conceptWriterId: users['ahmed'].id, dueDate: new Date('2026-03-16'), conceptApproved: false, finalApproved: false },
        { title: 'Ramadan Posts — Kalfink', titleAr: 'بوستات رمضان — كلفنك', category: 'social_post', status: 'new_request', priority: 'medium', clientId: clients['كلفنك'].id, campaignId: campaign3.id, platform: 'Instagram', format: '1080x1080', brief: 'بوستات رمضان', executorId: users['abdullah'].id, conceptWriterId: users['ahmed'].id, dueDate: new Date('2026-03-18'), conceptApproved: false, finalApproved: false },
    ];
    for (const r of cReqs) await prisma.creativeRequest.create({ data: r });
    console.log(`  ✅ ${cReqs.length} creative requests created`);

    // ═══════════════════════════════════════════════════════════
    // PRODUCTION JOBS
    // ═══════════════════════════════════════════════════════════
    const pJobs = [
        { title: 'Menu Photo Shoot — Al Warda', titleAr: 'تصوير منيو الوردة', jobType: 'photo', status: 'in_progress', priority: 'high', clientId: clients['الوردة'].id, campaignId: campaign1.id, location: 'مطعم الوردة — بغداد', assigneeId: users['musa'].id, dueDate: new Date('2026-03-07'), deliverables: '["photos","edited_photos"]' },
        { title: 'Kitchen Reel Shoot — Al Warda', titleAr: 'ريلز مطبخ الوردة', jobType: 'video', status: 'pending', priority: 'medium', clientId: clients['الوردة'].id, campaignId: campaign1.id, location: 'مطعم الوردة — بغداد', assigneeId: users['hassanin'].id, dueDate: new Date('2026-03-09'), shootDate: new Date('2026-03-08'), deliverables: '["reel","raw_footage"]' },
        { title: 'Aerial Drone Shoot — Rayhana', titleAr: 'تصوير جوي — ريحانة', jobType: 'video', status: 'pending', priority: 'urgent', clientId: clients['ريحانة'].id, campaignId: campaign2.id, location: 'مشروع ريحانة — أربيل', assigneeId: users['musa'].id, dueDate: new Date('2026-03-13'), deliverables: '["aerial_video","aerial_photos"]' },
        { title: 'Noor Launch Video — Zamzam', titleAr: 'فيديو إطلاق النور', jobType: 'video', status: 'pending', priority: 'urgent', clientId: clients['زمزم'].id, campaignId: campaign4.id, location: 'مكتب ريمارك', assigneeId: users['hassanin'].id, dueDate: new Date('2026-03-14'), deliverables: '["video","motion_graphics"]' },
    ];
    for (const j of pJobs) await prisma.productionJob.create({ data: j });
    console.log(`  ✅ ${pJobs.length} production jobs created`);

    // ═══════════════════════════════════════════════════════════
    // PUBLISHING ITEMS
    // ═══════════════════════════════════════════════════════════
    const pubItems = [
        { title: 'Lunch Promo Post — Al Warda', titleAr: 'بوست عرض الغداء — الوردة', status: 'published', clientId: clients['الوردة'].id, campaignId: campaign1.id, platform: 'Instagram', content: 'عرض الغداء الخاص ✨ #الوردة #عروض #بغداد', publishedAt: new Date('2026-03-01'), reviewerId: users['ibrahim'].id },
        { title: 'Daily Offers Story — Al Warda', titleAr: 'ستوري عروض — الوردة', status: 'published', clientId: clients['الوردة'].id, campaignId: campaign1.id, platform: 'Instagram', content: 'عروض يومية 🔥', scheduledAt: new Date('2026-03-02'), publishedAt: new Date('2026-03-02'), reviewerId: users['ibrahim'].id },
        { title: 'Rayhana Tour Reel', titleAr: 'ريلز جولة ريحانة', status: 'scheduled', clientId: clients['ريحانة'].id, campaignId: campaign2.id, platform: 'Instagram', content: 'جولة في المشروع الجديد 🏠 #ريحانة #عقارات #أربيل', scheduledAt: new Date('2026-03-15'), reviewerId: users['ibrahim'].id },
        { title: 'Ramadan Post — Kalfink', titleAr: 'بوست رمضان — كلفنك', status: 'draft', clientId: clients['كلفنك'].id, campaignId: campaign3.id, platform: 'Instagram', content: 'استعدي لرمضان 💄 #كلفنك #رمضان #جمال', scheduledAt: new Date('2026-03-16'), reviewerId: users['ibrahim'].id },
        { title: 'Noor Ad Video — Zamzam', titleAr: 'فيديو إعلان النور — زمزم', status: 'draft', clientId: clients['زمزم'].id, campaignId: campaign4.id, platform: 'Instagram', content: 'مشروع النور — قريباً 🌟 #زمزم #النور #عقارات', scheduledAt: new Date('2026-03-20'), reviewerId: users['ibrahim'].id },
    ];
    for (const p of pubItems) await prisma.publishingItem.create({ data: p });
    console.log(`  ✅ ${pubItems.length} publishing items created`);

    // ═══════════════════════════════════════════════════════════
    // CHAT ROOMS
    // ═══════════════════════════════════════════════════════════
    const companyRoom = await prisma.chatRoom.create({
        data: { name: 'General — Remark', nameAr: 'عام — ريمارك', type: 'company' },
    });
    const marketingRoom = await prisma.chatRoom.create({
        data: { name: 'Marketing Dept', nameAr: 'قسم التسويق', type: 'department' },
    });
    const creativeRoom = await prisma.chatRoom.create({
        data: { name: 'Creative Dept', nameAr: 'القسم الإبداعي', type: 'department' },
    });
    const productionRoom = await prisma.chatRoom.create({
        data: { name: 'Production Dept', nameAr: 'قسم الإنتاج', type: 'department' },
    });

    // Add all users to company room
    for (const uid of Object.values(users)) {
        await prisma.chatRoomMember.create({ data: { roomId: companyRoom.id, userId: uid.id, role: 'member' } });
    }
    // Add dept members to dept rooms
    for (const uid of [users['marketing'], users['social']]) {
        await prisma.chatRoomMember.create({ data: { roomId: marketingRoom.id, userId: uid.id, role: 'member' } });
    }
    for (const uid of [users['ahmed'], users['abdullah'], users['mohammed']]) {
        await prisma.chatRoomMember.create({ data: { roomId: creativeRoom.id, userId: uid.id, role: 'member' } });
    }
    for (const uid of [users['hassanin'], users['musa']]) {
        await prisma.chatRoomMember.create({ data: { roomId: productionRoom.id, userId: uid.id, role: 'member' } });
    }
    console.log('  ✅ Chat rooms created');

    console.log('\n🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
