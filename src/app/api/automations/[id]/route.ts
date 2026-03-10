import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { errorToResponse } from '@/lib/apiError';

// ─── Helper: Parse a SystemSetting into an AutomationRule ───

function settingToRule(setting: { id: string; key: string; value: string; createdAt: Date }) {
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

// GET /api/automations/[id] — Get a single automation rule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { id },
    });

    if (!setting || setting.category !== 'automation') {
      return NextResponse.json(
        { error: 'قاعدة الأتمتة غير موجودة', error_en: 'Automation rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(settingToRule(setting));
  } catch (error) {
    return errorToResponse(error);
  }
}

// PATCH /api/automations/[id] — Update or toggle an automation rule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    // Find the existing setting
    const existing = await prisma.systemSetting.findUnique({
      where: { id },
    });

    if (!existing || existing.category !== 'automation') {
      return NextResponse.json(
        { error: 'قاعدة الأتمتة غير موجودة', error_en: 'Automation rule not found' },
        { status: 404 }
      );
    }

    // Parse existing value and merge updates
    let ruleData: Record<string, unknown>;
    try {
      ruleData = JSON.parse(existing.value);
    } catch {
      ruleData = {};
    }

    if (body.name !== undefined) ruleData.name = body.name;
    if (body.nameAr !== undefined) ruleData.nameAr = body.nameAr;
    if (body.description !== undefined) ruleData.description = body.description;
    if (body.descriptionAr !== undefined) ruleData.descriptionAr = body.descriptionAr;
    if (body.trigger !== undefined) ruleData.trigger = body.trigger;
    if (body.triggerConfig !== undefined) ruleData.triggerConfig = body.triggerConfig;
    if (body.actions !== undefined) ruleData.actions = body.actions;
    if (body.enabled !== undefined) ruleData.enabled = body.enabled;

    const updated = await prisma.systemSetting.update({
      where: { id },
      data: { value: JSON.stringify(ruleData) },
    });

    return NextResponse.json(settingToRule(updated));
  } catch (error) {
    return errorToResponse(error);
  }
}

// DELETE /api/automations/[id] — Delete an automation rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const existing = await prisma.systemSetting.findUnique({
      where: { id },
    });

    if (!existing || existing.category !== 'automation') {
      return NextResponse.json(
        { error: 'قاعدة الأتمتة غير موجودة', error_en: 'Automation rule not found' },
        { status: 404 }
      );
    }

    await prisma.systemSetting.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorToResponse(error);
  }
}
