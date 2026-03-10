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
    ];

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

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

    for (const c of clientDefs) {
        await prisma.client.create({ data: c });
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
