import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { errorToResponse } from '@/lib/apiError';

// ─── Types for automation rules stored as JSON in SystemSetting ───

interface AutomationTriggerConfig {
  boardType?: string; // marketing_task, creative_request, production_job, publishing_item
  statusFrom?: string;
  statusTo?: string;
  priority?: string;
  field?: string;
  value?: string;
}

interface AutomationAction {
  type: string; // change_status, assign_user, create_notification, link_task
  targetBoardType?: string;
  status?: string;
  userId?: string;
  notificationTitle?: string;
  notificationTitleAr?: string;
  notificationMessage?: string;
  notificationMessageAr?: string;
}

interface AutomationRule {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  trigger: string; // status_change, task_created, due_date_approaching, field_change
  triggerConfig: AutomationTriggerConfig;
  actions: AutomationAction[];
  enabled: boolean;
  createdAt: string;
}

// ─── Helper: Get the first organization ID (single-tenant) ───

async function getOrganizationId(): Promise<string> {
  const org = await prisma.organization.findFirst({ select: { id: true } });
  if (!org) throw new Error('No organization found');
  return org.id;
}

// ─── Helper: Parse a SystemSetting into an AutomationRule ───

function settingToRule(setting: { id: string; key: string; value: string; createdAt: Date }): AutomationRule {
  try {
    const parsed = JSON.parse(setting.value);
    return {
      id: setting.id,
      name: parsed.name || setting.key,
      nameAr: parsed.nameAr || '',
      description: parsed.description || '',
      descriptionAr: parsed.descriptionAr || '',
      trigger: parsed.trigger || '',
      triggerConfig: parsed.triggerConfig || {},
      actions: parsed.actions || [],
      enabled: parsed.enabled !== false,
      createdAt: setting.createdAt.toISOString(),
    };
  } catch {
    return {
      id: setting.id,
      name: setting.key,
      nameAr: '',
      description: '',
      descriptionAr: '',
      trigger: '',
      triggerConfig: {},
      actions: [],
      enabled: false,
      createdAt: setting.createdAt.toISOString(),
    };
  }
}

// GET /api/automations — List all automation rules
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const organizationId = await getOrganizationId();

    const settings = await prisma.systemSetting.findMany({
      where: { organizationId, category: 'automation' },
      orderBy: { createdAt: 'asc' },
    });

    const rules = settings.map(settingToRule);
    return NextResponse.json(rules);
  } catch (error) {
    return errorToResponse(error);
  }
}

// POST /api/automations — Create a new automation rule
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { name, nameAr, description, descriptionAr, trigger, triggerConfig, actions, enabled } = body;

    if (!name || !trigger) {
      return NextResponse.json(
        { error: 'الاسم والمشغل مطلوبان', error_en: 'Name and trigger are required' },
        { status: 400 }
      );
    }

    const organizationId = await getOrganizationId();

    // Generate a unique key for this automation rule
    const ruleKey = `automation_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const ruleData: Omit<AutomationRule, 'id' | 'createdAt'> = {
      name,
      nameAr: nameAr || '',
      description: description || '',
      descriptionAr: descriptionAr || '',
      trigger,
      triggerConfig: triggerConfig || {},
      actions: actions || [],
      enabled: enabled !== false,
    };

    const setting = await prisma.systemSetting.create({
      data: {
        organizationId,
        category: 'automation',
        key: ruleKey,
        value: JSON.stringify(ruleData),
      },
    });

    return NextResponse.json(settingToRule(setting), { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
