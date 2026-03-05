import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Remark PM database...');

    // ==================== USERS ====================
    const passwordHash = await bcrypt.hash('remark2026', 12);

    const users = await Promise.all([
        prisma.user.create({ data: { email: 'mustafa@remark.iq', name: 'Mustafa Khalaf', password: passwordHash, role: 'CEO' } }),
        prisma.user.create({ data: { email: 'yousif@remark.iq', name: 'Yousif (COO)', password: passwordHash, role: 'COO' } }),
        prisma.user.create({ data: { email: 'ahmed@remark.iq', name: 'Ahmed (Creative Manager)', password: passwordHash, role: 'CREATIVE_MANAGER' } }),
        prisma.user.create({ data: { email: 'hassanin@remark.iq', name: 'Hassanin (Production Manager)', password: passwordHash, role: 'PRODUCTION_MANAGER' } }),
        prisma.user.create({ data: { email: 'marketing@remark.iq', name: 'Marketing Manager', password: passwordHash, role: 'MARKETING' } }),
        prisma.user.create({ data: { email: 'mohammed@remark.iq', name: 'Mohammed (Copywriter)', password: passwordHash, role: 'COPYWRITER' } }),
        prisma.user.create({ data: { email: 'abdullah@remark.iq', name: 'Abdullah (Designer)', password: passwordHash, role: 'DESIGNER' } }),
        prisma.user.create({ data: { email: 'saif@remark.iq', name: 'Saif (Account Manager)', password: passwordHash, role: 'ACCOUNT_MANAGER' } }),
        prisma.user.create({ data: { email: 'wedyan@remark.iq', name: 'Wedyan (Account Manager)', password: passwordHash, role: 'ACCOUNT_MANAGER' } }),
        prisma.user.create({ data: { email: 'social@remark.iq', name: 'Social Media Specialist', password: passwordHash, role: 'MARKETING' } }),
        prisma.user.create({ data: { email: 'ibrahim@remark.iq', name: 'Ibrahim Alakeel', password: passwordHash, role: 'MEMBER' } }),
        prisma.user.create({ data: { email: 'musa@remark.iq', name: 'Musa (Production)', password: passwordHash, role: 'PRODUCTION_MANAGER' } }),
    ]);

    const [mustafa, yousif, ahmed, hassanin, marketingMgr, mohammed, abdullah, saif, wedyan, social, ibrahim, musa] = users;
    console.log(`  ✅ Created ${users.length} users`);

    // ==================== WORKSPACE ====================
    const workspace = await prisma.workspace.create({
        data: { name: 'Remark', description: 'Remark Creative Agency Workspace' },
    });

    // Add all users as workspace members
    await Promise.all(
        users.map((u, i) =>
            prisma.workspaceMember.create({
                data: {
                    userId: u.id,
                    workspaceId: workspace.id,
                    role: i === 0 ? 'ADMIN' : 'MEMBER',
                },
            })
        )
    );
    console.log('  ✅ Created workspace & members');

    // ==================== CUSTOM FIELDS ====================
    const fields = await Promise.all([
        prisma.customField.create({
            data: {
                name: 'creativeState', displayName: 'Creative State', fieldType: 'LIST',
                options: JSON.stringify([
                    { value: 'briefing', label: 'Briefing' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'ready_to_review', label: 'Ready to Review' },
                    { value: 'ready_to_production', label: 'Ready to Production' },
                ]),
                workspaceId: workspace.id,
            },
        }),
        prisma.customField.create({
            data: {
                name: 'contentType', displayName: 'نوع المحتوى', fieldType: 'LIST',
                options: JSON.stringify([
                    { value: 'video', label: 'فيديو' },
                    { value: 'design', label: 'تصميم' },
                    { value: 'reel', label: 'Reel' },
                    { value: 'story', label: 'Story' },
                ]),
                workspaceId: workspace.id, position: 1,
            },
        }),
        prisma.customField.create({
            data: {
                name: 'productionState', displayName: 'حاله البرودكشن', fieldType: 'LIST',
                options: JSON.stringify([
                    { value: 'ready_to_shoot', label: 'جاهز للتصوير' },
                    { value: 'shooting', label: 'تصوير' },
                    { value: 'editing', label: 'مونتاج' },
                    { value: 'review_requested', label: 'طلب مراجعة' },
                    { value: 'needs_logistics', label: 'بحاجه للوجستيات' },
                ]),
                workspaceId: workspace.id, position: 2,
            },
        }),
        prisma.customField.create({
            data: {
                name: 'taskAssignment', displayName: 'توكيل المهمه', fieldType: 'LIST',
                options: JSON.stringify([
                    { value: 'hassanin', label: 'حسنين' },
                    { value: 'mustafa_prod', label: 'مصطفى' },
                    { value: 'musa', label: 'موسى' },
                ]),
                workspaceId: workspace.id, position: 3,
            },
        }),
        prisma.customField.create({
            data: {
                name: 'finalReview', displayName: 'تقييم نهائي', fieldType: 'LIST',
                options: JSON.stringify([
                    { value: 'pending', label: 'قيد المراجعة' },
                    { value: 'client_approved', label: 'موافق كلاينت' },
                    { value: 'rejected', label: 'مرفوض' },
                    { value: 'revision_needed', label: 'يحتاج تعديل' },
                ]),
                workspaceId: workspace.id, position: 4,
            },
        }),
        prisma.customField.create({
            data: {
                name: 'publishDate', displayName: 'تاريخ النشر', fieldType: 'DATE',
                options: '[]',
                workspaceId: workspace.id, position: 5,
            },
        }),
    ]);

    const [creativeStateField, contentTypeField, productionStateField, taskAssignmentField, finalReviewField, publishDateField] = fields;
    console.log(`  ✅ Created ${fields.length} custom fields`);

    // ==================== BOARDS ====================
    const boardColors = ['#6366f1', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#3b82f6', '#a855f7', '#84cc16', '#64748b'];

    const boardDefs = [
        { name: 'CEO', color: boardColors[0], type: 'PIPELINE', lists: ['CEO Creative Reviewing', 'In Progress', 'CEO Final Reviewing', 'Client Approved'] },
        { name: 'COO', color: boardColors[1], type: 'PIPELINE', lists: ['COO Review', 'In Progress', 'Approved', 'Rejected'] },
        { name: 'creative team', color: boardColors[2], type: 'KANBAN', lists: ['Briefes', 'الوردة', 'الشهيرة', 'كلفنك', 'ريحانة السكني', 'زمزم', 'ريحانة بارك', 'ريحانة كروب', 'My Time'] },
        { name: 'marketing', color: boardColors[3], type: 'PIPELINE', lists: ['Strategy', 'Content Plan', 'In Review', 'Approved', 'Scheduled', 'Published', 'Archive'] },
        { name: 'production', color: boardColors[4], type: 'KANBAN', lists: ['Production', 'لوجستيات', 'Hassanin', 'Musa', 'Mustafa'] },
        { name: 'publish', color: boardColors[5], type: 'PIPELINE', lists: ['Ready', 'Scheduled', 'Published', 'Archive'] },
        { name: 'الوردة', color: boardColors[6], type: 'PIPELINE', lists: ['Marketing', 'Creative', 'Production', 'Reviewing', 'Publishing & Promoting', 'Done', 'Reject'] },
        { name: 'الشهيرة', color: boardColors[7], type: 'PIPELINE', lists: ['Marketing', 'Creative', 'Production', 'Reviewing', 'Publishing & Promoting', 'Done', 'Reject'] },
        { name: 'كلفنك', color: boardColors[8], type: 'PIPELINE', lists: ['Marketing', 'Creative', 'Production', 'Reviewing', 'Publishing & Promoting', 'Done', 'Reject'] },
        { name: 'زمزم', color: boardColors[9], type: 'PIPELINE', lists: ['Marketing', 'Creative', 'Production', 'Reviewing', 'Publishing & Promoting', 'Done', 'Reject'] },
        { name: 'ريحانة السكني', color: boardColors[10], type: 'PIPELINE', lists: ['Marketing', 'Creative', 'Production', 'Reviewing', 'Publishing & Promoting', 'Done', 'Reject'] },
        { name: 'ريحانة بارك', color: boardColors[11], type: 'PIPELINE', lists: ['Marketing', 'Creative', 'Production', 'Reviewing', 'Publishing & Promoting', 'Done', 'Reject'] },
        { name: 'مجموعة ريحانة', color: boardColors[12], type: 'PIPELINE', lists: ['Marketing', 'Creative', 'Production', 'Reviewing', 'Publishing & Promoting', 'Done', 'Reject'] },
    ];

    const boards: Record<string, any> = {};

    for (let i = 0; i < boardDefs.length; i++) {
        const def = boardDefs[i];
        const board = await prisma.board.create({
            data: {
                name: def.name,
                color: def.color,
                boardType: def.type,
                position: i,
                workspaceId: workspace.id,
            },
        });

        // Create lists for each board
        for (let j = 0; j < def.lists.length; j++) {
            await prisma.list.create({
                data: { name: def.lists[j], position: j, boardId: board.id },
            });
        }

        // Link custom fields to each board
        for (const field of fields) {
            await prisma.boardCustomField.create({
                data: { boardId: board.id, fieldId: field.id },
            });
        }

        boards[def.name] = board;
    }
    console.log(`  ✅ Created ${boardDefs.length} boards with lists`);

    // ==================== SAMPLE CARDS ====================
    const creativeBoard = await prisma.board.findFirst({ where: { name: 'creative team' }, include: { lists: true } });
    if (creativeBoard) {
        const listMap: Record<string, string> = {};
        creativeBoard.lists.forEach(l => { listMap[l.name] = l.id; });

        const sampleCards = [
            { name: 'فيديو top 10 ترند', list: 'الشهيرة', status: 'OPEN', creativeState: 'ready_to_review', contentType: 'video' },
            { name: 'روتين العناية برمضان - شهر الثاني - كلفنك', list: 'كلفنك', status: 'OPEN', creativeState: 'ready_to_production', contentType: 'video', dueDate: '2026-02-23T17:00:00Z', assignment: 'mustafa_prod', productionState: 'review_requested' },
            { name: 'تصميم رمضان و المستقبل - ريحانة بارك', list: 'ريحانة بارك', status: 'COMPLETED', contentType: 'design', dueDate: '2026-02-18T09:00:00Z' },
            { name: 'فديو صراع حول سلة رمضان - الوردة', list: 'الوردة', status: 'OPEN', contentType: 'video', dueDate: '2026-03-02T18:00:00Z' },
            { name: 'فديو رسالة العربات - الوردة', list: 'الوردة', status: 'COMPLETED', creativeState: 'ready_to_production', contentType: 'video', dueDate: '2026-02-27T18:00:00Z', assignment: 'hassanin', productionState: 'review_requested' },
            { name: 'زمزم - الحمام - شهر ثاني', list: 'زمزم', status: 'OPEN', creativeState: 'ready_to_review', contentType: 'video', dueDate: '2026-03-01T18:00:00Z' },
            { name: 'زمزم - بالكونة - شهر الثاني', list: 'زمزم', status: 'OPEN', creativeState: 'ready_to_production', contentType: 'video', dueDate: '2026-02-22T18:00:00Z' },
            { name: 'اجواء رمضان - الوردة', list: 'الوردة', status: 'COMPLETED', creativeState: 'ready_to_production', contentType: 'video', dueDate: '2026-02-28T18:00:00Z', assignment: 'musa', productionState: 'review_requested' },
            { name: 'الوردة - ماركتنك بريف - الشهر الثاني', list: 'Briefes', status: 'COMPLETED' },
            { name: 'بريف كلفنك - شهر الثاني', list: 'Briefes', status: 'OPEN' },
            { name: 'مجموعة الريحانة', list: 'Briefes', status: 'OPEN' },
            { name: 'مجمع زمزم السكني', list: 'Briefes', status: 'OPEN' },
            { name: 'ريحانة السكني', list: 'Briefes', status: 'OPEN' },
            { name: 'ريحانة بارك', list: 'Briefes', status: 'OPEN' },
            { name: 'تهنئة رمضان للفروع الثلاث - الوردة', list: 'الوردة', status: 'COMPLETED', contentType: 'design', dueDate: '2026-02-18T18:00:00Z' },
            { name: 'ريحانة كروب- تقرير تعليمي (رؤية كربلاء الاقتصادية)', list: 'ريحانة كروب', status: 'OPEN', contentType: 'video', dueDate: '2026-02-19T18:00:00Z' },
            { name: 'تصميم لغة الارقام - ريحانة كروب', list: 'ريحانة كروب', status: 'OPEN', contentType: 'design', dueDate: '2026-02-22T18:00:00Z' },
            { name: 'إعلان عزوز وروان - كلفنك', list: 'كلفنك', status: 'OPEN', contentType: 'video', dueDate: '2026-03-05T18:00:00Z' },
            { name: 'تصميم عرض خاص رمضان - كلفنك', list: 'كلفنك', status: 'OPEN', contentType: 'design', dueDate: '2026-03-01T12:00:00Z' },
            { name: 'فديو لايف ستايل منتجات - ريحانة السكني', list: 'ريحانة السكني', status: 'OPEN', contentType: 'video', dueDate: '2026-03-03T18:00:00Z' },
        ];

        for (let i = 0; i < sampleCards.length; i++) {
            const sc = sampleCards[i];
            const listId = listMap[sc.list];
            if (!listId) continue;

            const card = await prisma.card.create({
                data: {
                    name: sc.name,
                    listId,
                    position: i * 65536,
                    status: sc.status || 'OPEN',
                    dueDate: sc.dueDate ? new Date(sc.dueDate) : undefined,
                    mirrorGroupId: `mirror_${i}`,
                },
            });

            // Set custom field values
            if (sc.creativeState) {
                await prisma.cardFieldValue.create({ data: { cardId: card.id, fieldId: creativeStateField.id, value: sc.creativeState } });
            }
            if (sc.contentType) {
                await prisma.cardFieldValue.create({ data: { cardId: card.id, fieldId: contentTypeField.id, value: sc.contentType } });
            }
            if (sc.productionState) {
                await prisma.cardFieldValue.create({ data: { cardId: card.id, fieldId: productionStateField.id, value: sc.productionState } });
            }
            if (sc.assignment) {
                await prisma.cardFieldValue.create({ data: { cardId: card.id, fieldId: taskAssignmentField.id, value: sc.assignment } });
            }

            // Assign cards to relevant users
            if (sc.assignment === 'hassanin') {
                await prisma.cardAssignee.create({ data: { cardId: card.id, userId: hassanin.id } });
            } else if (sc.assignment === 'mustafa_prod') {
                await prisma.cardAssignee.create({ data: { cardId: card.id, userId: mustafa.id } });
            } else if (sc.assignment === 'musa') {
                await prisma.cardAssignee.create({ data: { cardId: card.id, userId: musa.id } });
            }
        }
        console.log(`  ✅ Created ${sampleCards.length} sample cards with attributes`);
    }

    // ==================== DEFAULT CHANNELS ====================
    const generalChannel = await prisma.channel.create({
        data: {
            name: 'عام',
            description: 'قناة النقاش العامة لفريق Remark',
            channelType: 'PUBLIC',
            workspaceId: workspace.id,
        },
    });
    const creativeChannel = await prisma.channel.create({
        data: {
            name: 'الفريق الإبداعي',
            description: 'نقاشات الفريق الإبداعي والمحتوى',
            channelType: 'PUBLIC',
            workspaceId: workspace.id,
        },
    });
    const productionChannel = await prisma.channel.create({
        data: {
            name: 'البرودكشن',
            description: 'متابعة الإنتاج والتصوير',
            channelType: 'PUBLIC',
            workspaceId: workspace.id,
        },
    });

    // Add all users to general channel
    for (const user of users) {
        await prisma.channelMember.create({ data: { channelId: generalChannel.id, userId: user.id } });
    }
    // Add creative team to creative channel
    for (const user of [mustafa, ahmed, mohammed, abdullah, marketingMgr]) {
        await prisma.channelMember.create({ data: { channelId: creativeChannel.id, userId: user.id } });
    }
    // Add production team to production channel
    for (const user of [mustafa, hassanin, musa, yousif]) {
        await prisma.channelMember.create({ data: { channelId: productionChannel.id, userId: user.id } });
    }
    console.log('  ✅ Created default channels');

    // ==================== AUTOMATION RULES ====================
    await prisma.automationRule.create({
        data: {
            name: 'Auto-Mirror to Production',
            description: 'When creative state changes to "ready to production", mirror card to production board',
            trigger: 'FIELD_CHANGE',
            triggerConfig: JSON.stringify({ fieldName: 'creativeState', toValue: 'ready_to_production' }),
            actions: JSON.stringify([{ type: 'MIRROR', targetBoard: 'production' }, { type: 'NOTIFY', message: 'بطاقة جديدة جاهزة للبرودكشن' }]),
            workspaceId: workspace.id,
        },
    });
    await prisma.automationRule.create({
        data: {
            name: 'Auto-Mirror to CEO Review',
            description: 'When production state changes to "review requested", mirror card to CEO board',
            trigger: 'FIELD_CHANGE',
            triggerConfig: JSON.stringify({ fieldName: 'productionState', toValue: 'review_requested' }),
            actions: JSON.stringify([{ type: 'MIRROR', targetBoard: 'CEO' }, { type: 'NOTIFY', message: 'بطاقة جاهزة للمراجعة النهائية' }]),
            workspaceId: workspace.id,
        },
    });
    await prisma.automationRule.create({
        data: {
            name: 'Auto-Mirror to Publish',
            description: 'When final review is "client approved", mirror card to publish board',
            trigger: 'FIELD_CHANGE',
            triggerConfig: JSON.stringify({ fieldName: 'finalReview', toValue: 'client_approved' }),
            actions: JSON.stringify([{ type: 'MIRROR', targetBoard: 'publish' }, { type: 'NOTIFY', message: 'محتوى موافق عليه — جاهز للنشر' }]),
            workspaceId: workspace.id,
        },
    });
    await prisma.automationRule.create({
        data: {
            name: 'Notify on Assignment',
            description: 'When a task is assigned, notify the assigned user',
            trigger: 'FIELD_CHANGE',
            triggerConfig: JSON.stringify({ fieldName: 'taskAssignment' }),
            actions: JSON.stringify([{ type: 'NOTIFY', message: 'تم توكيلك بمهمة جديدة' }]),
            workspaceId: workspace.id,
        },
    });
    await prisma.automationRule.create({
        data: {
            name: 'Due Date Alert',
            description: 'Notify assignees when due date is within 24 hours',
            trigger: 'DUE_DATE',
            triggerConfig: JSON.stringify({ hoursBeforeDue: 24 }),
            actions: JSON.stringify([{ type: 'NOTIFY', message: 'موعد تسليم قريب!' }]),
            workspaceId: workspace.id,
        },
    });
    console.log('  ✅ Created 5 automation rules');

    console.log('\n🎉 Seeding complete!');
    console.log(`   Login: mustafa@remark.iq / remark2026`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
