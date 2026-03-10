import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { errorToResponse } from '@/lib/apiError';

// ─── Seed data: sample automation rules for Remark PM ───

interface SeedRule {
  key: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  trigger: string;
  triggerConfig: Record<string, string>;
  actions: Array<Record<string, string>>;
  enabled: boolean;
}

function getSampleRules(): SeedRule[] {
  return [
    // 1. When a marketing task moves to "approved", notify the team
    {
      key: 'automation_seed_marketing_approved',
      name: 'Marketing Task Approved Notification',
      nameAr: 'إشعار الموافقة على مهمة تسويق',
      description: 'Sends a notification when a marketing task is approved',
      descriptionAr: 'يرسل إشعارًا عند الموافقة على مهمة تسويقية',
      trigger: 'status_change',
      triggerConfig: {
        boardType: 'marketing_task',
        statusTo: 'approved',
      },
      actions: [
        {
          type: 'create_notification',
          notificationTitle: 'Marketing Task Approved',
          notificationTitleAr: 'تم اعتماد مهمة التسويق',
          notificationMessage: 'A marketing task has been approved and is ready for creative execution.',
          notificationMessageAr: 'تم اعتماد مهمة التسويق وهي جاهزة للتنفيذ الإبداعي.',
        },
      ],
      enabled: true,
    },

    // 2. When a creative request is completed, log the activity
    {
      key: 'automation_seed_creative_completed',
      name: 'Creative Request Completed Logger',
      nameAr: 'تسجيل اكتمال الطلب الإبداعي',
      description: 'Logs activity when a creative request reaches approved_ready status',
      descriptionAr: 'يسجل النشاط عندما يصل الطلب الإبداعي إلى حالة الموافقة',
      trigger: 'status_change',
      triggerConfig: {
        boardType: 'creative_request',
        statusTo: 'approved_ready',
      },
      actions: [
        { type: 'log_activity' },
        {
          type: 'create_notification',
          notificationTitle: 'Creative Request Ready',
          notificationTitleAr: 'الطلب الإبداعي جاهز',
          notificationMessage: 'A creative request has been approved and is ready for production.',
          notificationMessageAr: 'تم اعتماد الطلب الإبداعي وهو جاهز للإنتاج.',
        },
      ],
      enabled: true,
    },

    // 3. When a production job status changes to "in_production", notify
    {
      key: 'automation_seed_production_started',
      name: 'Production Job Started Notification',
      nameAr: 'إشعار بدء مهمة الإنتاج',
      description: 'Notifies when a production job enters in_production phase',
      descriptionAr: 'يرسل إشعارًا عندما تدخل مهمة الإنتاج مرحلة التنفيذ',
      trigger: 'status_change',
      triggerConfig: {
        boardType: 'production_job',
        statusTo: 'in_production',
      },
      actions: [
        {
          type: 'create_notification',
          notificationTitle: 'Production Started',
          notificationTitleAr: 'بدأ الإنتاج',
          notificationMessage: 'A production job has entered the production phase.',
          notificationMessageAr: 'دخلت مهمة الإنتاج مرحلة التنفيذ.',
        },
      ],
      enabled: true,
    },

    // 4. When a publishing item is published, log and notify
    {
      key: 'automation_seed_publishing_published',
      name: 'Content Published Notification',
      nameAr: 'إشعار نشر المحتوى',
      description: 'Notifies and logs when content is published',
      descriptionAr: 'يرسل إشعارًا ويسجل عند نشر المحتوى',
      trigger: 'status_change',
      triggerConfig: {
        boardType: 'publishing_item',
        statusTo: 'published',
      },
      actions: [
        { type: 'log_activity' },
        {
          type: 'create_notification',
          notificationTitle: 'Content Published!',
          notificationTitleAr: 'تم نشر المحتوى!',
          notificationMessage: 'Content has been successfully published.',
          notificationMessageAr: 'تم نشر المحتوى بنجاح.',
        },
      ],
      enabled: true,
    },

    // 5. When any task is created, log the creation
    {
      key: 'automation_seed_task_created_log',
      name: 'New Task Activity Logger',
      nameAr: 'تسجيل نشاط المهام الجديدة',
      description: 'Logs activity whenever a new task is created in any board',
      descriptionAr: 'يسجل النشاط عند إنشاء مهمة جديدة في أي لوحة',
      trigger: 'task_created',
      triggerConfig: {},
      actions: [{ type: 'log_activity' }],
      enabled: true,
    },

    // 6. Urgent priority notification
    {
      key: 'automation_seed_urgent_priority',
      name: 'Urgent Priority Alert',
      nameAr: 'تنبيه الأولوية العاجلة',
      description: 'Sends notification when a task is set to urgent priority',
      descriptionAr: 'يرسل إشعارًا عند تعيين مهمة بأولوية عاجلة',
      trigger: 'priority_change',
      triggerConfig: {
        priority: 'urgent',
      },
      actions: [
        {
          type: 'create_notification',
          notificationTitle: 'Urgent Task Alert',
          notificationTitleAr: 'تنبيه مهمة عاجلة',
          notificationMessage: 'A task has been marked as urgent priority. Immediate attention required.',
          notificationMessageAr: 'تم تعيين مهمة بأولوية عاجلة. يتطلب اهتمامًا فوريًا.',
        },
      ],
      enabled: true,
    },

    // 7. Client approval notification (creative workflow)
    {
      key: 'automation_seed_client_approval',
      name: 'Client Approval Notification',
      nameAr: 'إشعار موافقة العميل',
      description: 'Notifies when a creative request receives client approval',
      descriptionAr: 'يرسل إشعارًا عند حصول الطلب الإبداعي على موافقة العميل',
      trigger: 'field_change',
      triggerConfig: {
        boardType: 'creative_request',
        field: 'finalApproved',
        value: 'true',
      },
      actions: [
        {
          type: 'create_notification',
          notificationTitle: 'Client Approved Creative',
          notificationTitleAr: 'العميل وافق على الإبداعي',
          notificationMessage: 'The client has approved the creative request. Ready for production.',
          notificationMessageAr: 'وافق العميل على الطلب الإبداعي. جاهز للإنتاج.',
        },
        { type: 'log_activity' },
      ],
      enabled: true,
    },

    // 8. Rejection notification
    {
      key: 'automation_seed_rejection_alert',
      name: 'Creative Rejection Alert',
      nameAr: 'تنبيه رفض الإبداعي',
      description: 'Alerts the team when a creative request is blocked',
      descriptionAr: 'ينبه الفريق عند حظر طلب إبداعي',
      trigger: 'field_change',
      triggerConfig: {
        boardType: 'creative_request',
        field: 'blocked',
        value: 'true',
      },
      actions: [
        {
          type: 'create_notification',
          notificationTitle: 'Creative Request Blocked',
          notificationTitleAr: 'تم حظر الطلب الإبداعي',
          notificationMessage: 'A creative request has been blocked. Please review and take action.',
          notificationMessageAr: 'تم حظر طلب إبداعي. يرجى المراجعة واتخاذ إجراء.',
        },
      ],
      enabled: true,
    },
  ];
}

// POST /api/automations/seed — Seed sample automation rules
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    // Get the organization
    const org = await prisma.organization.findFirst({ select: { id: true } });
    if (!org) {
      return NextResponse.json(
        { error: 'لم يتم العثور على المنظمة', error_en: 'No organization found. Please seed the database first.' },
        { status: 400 }
      );
    }

    const organizationId = org.id;

    // Clear existing automation rules
    await prisma.systemSetting.deleteMany({
      where: { organizationId, category: 'automation' },
    });

    // Create new rules
    const rules = getSampleRules();
    const created: Array<{ id: string; name: string; key: string }> = [];

    for (const rule of rules) {
      const ruleValue = {
        name: rule.name,
        nameAr: rule.nameAr,
        description: rule.description,
        descriptionAr: rule.descriptionAr,
        trigger: rule.trigger,
        triggerConfig: rule.triggerConfig,
        actions: rule.actions,
        enabled: rule.enabled,
      };

      const setting = await prisma.systemSetting.create({
        data: {
          organizationId,
          category: 'automation',
          key: rule.key,
          value: JSON.stringify(ruleValue),
        },
      });

      created.push({ id: setting.id, name: rule.name, key: rule.key });
    }

    return NextResponse.json({
      success: true,
      message: `تم إنشاء ${created.length} قاعدة أتمتة / Created ${created.length} automation rules`,
      count: created.length,
      rules: created,
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
