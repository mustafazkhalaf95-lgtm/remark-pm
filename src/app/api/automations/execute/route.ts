import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { errorToResponse } from '@/lib/apiError';

// ─── Types ───

interface AutomationTriggerConfig {
  boardType?: string;
  statusFrom?: string;
  statusTo?: string;
  priority?: string;
  field?: string;
  value?: string;
}

interface AutomationAction {
  type: string;
  targetBoardType?: string;
  status?: string;
  userId?: string;
  notificationTitle?: string;
  notificationTitleAr?: string;
  notificationMessage?: string;
  notificationMessageAr?: string;
}

interface AutomationRuleData {
  name: string;
  nameAr: string;
  trigger: string;
  triggerConfig: AutomationTriggerConfig;
  actions: AutomationAction[];
  enabled: boolean;
}

// ─── Board type to Prisma model mapping ───

type BoardType = 'marketing_task' | 'creative_request' | 'production_job' | 'publishing_item';

const VALID_BOARD_TYPES: BoardType[] = [
  'marketing_task',
  'creative_request',
  'production_job',
  'publishing_item',
];

// ─── Helper: Fetch a task by board type and ID ───

async function fetchTask(boardType: string, taskId: string) {
  switch (boardType) {
    case 'marketing_task':
      return prisma.marketingTask.findUnique({
        where: { id: taskId },
        include: { client: true, campaign: true, assignee: true },
      });
    case 'creative_request':
      return prisma.creativeRequest.findUnique({
        where: { id: taskId },
        include: { client: true, campaign: true, conceptWriter: true, executor: true },
      });
    case 'production_job':
      return prisma.productionJob.findUnique({
        where: { id: taskId },
        include: { client: true, campaign: true, assignee: true },
      });
    case 'publishing_item':
      return prisma.publishingItem.findUnique({
        where: { id: taskId },
        include: { client: true, campaign: true, reviewer: true },
      });
    default:
      return null;
  }
}

// ─── Helper: Update task status ───

async function updateTaskStatus(boardType: string, taskId: string, status: string) {
  switch (boardType) {
    case 'marketing_task':
      return prisma.marketingTask.update({ where: { id: taskId }, data: { status } });
    case 'creative_request':
      return prisma.creativeRequest.update({ where: { id: taskId }, data: { status } });
    case 'production_job':
      return prisma.productionJob.update({ where: { id: taskId }, data: { status } });
    case 'publishing_item':
      return prisma.publishingItem.update({ where: { id: taskId }, data: { status } });
    default:
      return null;
  }
}

// ─── Helper: Assign user to task ───

async function assignUserToTask(boardType: string, taskId: string, userId: string) {
  switch (boardType) {
    case 'marketing_task':
      return prisma.marketingTask.update({
        where: { id: taskId },
        data: { assigneeId: userId },
      });
    case 'creative_request':
      return prisma.creativeRequest.update({
        where: { id: taskId },
        data: { executorId: userId },
      });
    case 'production_job':
      return prisma.productionJob.update({
        where: { id: taskId },
        data: { assigneeId: userId },
      });
    case 'publishing_item':
      return prisma.publishingItem.update({
        where: { id: taskId },
        data: { reviewerId: userId },
      });
    default:
      return null;
  }
}

// POST /api/automations/execute — Execute automation rules for a task event
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const {
      taskId,
      boardType,
      trigger,
      statusFrom,
      statusTo,
      field,
      value,
    } = body;

    if (!taskId || !boardType || !trigger) {
      return NextResponse.json(
        {
          error: 'معرف المهمة ونوع اللوحة والمشغل مطلوبة',
          error_en: 'taskId, boardType, and trigger are required',
        },
        { status: 400 }
      );
    }

    if (!VALID_BOARD_TYPES.includes(boardType)) {
      return NextResponse.json(
        {
          error: 'نوع اللوحة غير صالح',
          error_en: `Invalid boardType. Must be one of: ${VALID_BOARD_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Fetch the task to confirm it exists
    const task = await fetchTask(boardType, taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'المهمة غير موجودة', error_en: 'Task not found' },
        { status: 404 }
      );
    }

    // Get the organization to find automation rules
    const org = await prisma.organization.findFirst({ select: { id: true } });
    if (!org) {
      return NextResponse.json(
        { error: 'لم يتم العثور على المنظمة', error_en: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get all enabled automation rules
    const settings = await prisma.systemSetting.findMany({
      where: { organizationId: org.id, category: 'automation' },
    });

    const executedActions: Array<{
      type: string;
      ruleId: string;
      ruleName: string;
      success: boolean;
      detail?: string;
      error?: string;
    }> = [];

    for (const setting of settings) {
      let ruleData: AutomationRuleData;
      try {
        ruleData = JSON.parse(setting.value);
      } catch {
        continue;
      }

      // Skip disabled rules
      if (!ruleData.enabled) continue;

      // Check if trigger matches
      if (ruleData.trigger !== trigger) continue;

      const config = ruleData.triggerConfig || {};

      // Check board type filter
      if (config.boardType && config.boardType !== boardType) continue;

      // Check trigger conditions
      let shouldExecute = false;

      switch (trigger) {
        case 'status_change':
          if (config.statusFrom && config.statusFrom !== statusFrom) continue;
          if (config.statusTo && config.statusTo !== statusTo) continue;
          shouldExecute = true;
          break;

        case 'task_created':
          shouldExecute = true;
          break;

        case 'field_change':
          if (config.field && config.field !== field) continue;
          if (config.value && config.value !== value) continue;
          shouldExecute = true;
          break;

        case 'due_date_approaching':
          shouldExecute = true;
          break;

        case 'priority_change':
          if (config.priority && config.priority !== value) continue;
          shouldExecute = true;
          break;

        default:
          shouldExecute = true;
          break;
      }

      if (!shouldExecute) continue;

      // Execute each action in the rule
      const actions = ruleData.actions || [];
      for (const action of actions) {
        try {
          switch (action.type) {
            case 'change_status': {
              if (action.status) {
                const targetType = action.targetBoardType || boardType;
                await updateTaskStatus(targetType, taskId, action.status);
                executedActions.push({
                  type: 'change_status',
                  ruleId: setting.id,
                  ruleName: ruleData.name,
                  success: true,
                  detail: `Changed ${targetType} status to ${action.status}`,
                });
              }
              break;
            }

            case 'assign_user': {
              if (action.userId) {
                const targetType = action.targetBoardType || boardType;
                await assignUserToTask(targetType, taskId, action.userId);
                executedActions.push({
                  type: 'assign_user',
                  ruleId: setting.id,
                  ruleName: ruleData.name,
                  success: true,
                  detail: `Assigned user ${action.userId} to ${targetType}`,
                });
              }
              break;
            }

            case 'create_notification': {
              // Send notification to relevant users
              const targetUserId = action.userId || auth.session.user.id;
              await prisma.notification.create({
                data: {
                  userId: targetUserId,
                  type: 'system',
                  title: action.notificationTitle || `تنفيذ أتمتة: ${ruleData.name}`,
                  titleAr: action.notificationTitleAr || `تنفيذ أتمتة: ${ruleData.nameAr || ruleData.name}`,
                  message: action.notificationMessage || `تم تنفيذ القاعدة "${ruleData.name}" على المهمة "${task.title}"`,
                  messageAr: action.notificationMessageAr || `تم تنفيذ القاعدة "${ruleData.nameAr || ruleData.name}" على المهمة "${task.title}"`,
                  entityType: boardType,
                  entityId: taskId,
                },
              });
              executedActions.push({
                type: 'create_notification',
                ruleId: setting.id,
                ruleName: ruleData.name,
                success: true,
                detail: `Notification sent to user ${targetUserId}`,
              });
              break;
            }

            case 'log_activity': {
              await prisma.activityLog.create({
                data: {
                  userId: auth.session.user.id,
                  clientId: task.clientId,
                  entityType: boardType,
                  entityId: taskId,
                  action: 'automation_executed',
                  details: JSON.stringify({
                    ruleName: ruleData.name,
                    trigger,
                    taskTitle: task.title,
                  }),
                },
              });
              executedActions.push({
                type: 'log_activity',
                ruleId: setting.id,
                ruleName: ruleData.name,
                success: true,
              });
              break;
            }

            default: {
              executedActions.push({
                type: action.type,
                ruleId: setting.id,
                ruleName: ruleData.name,
                success: false,
                error: `Unknown action type: ${action.type}`,
              });
            }
          }
        } catch (actionErr: unknown) {
          const errorMessage = actionErr instanceof Error ? actionErr.message : 'Unknown error';
          executedActions.push({
            type: action.type,
            ruleId: setting.id,
            ruleName: ruleData.name,
            success: false,
            error: errorMessage,
          });
        }
      }

      // Log automation execution as activity
      await prisma.activityLog.create({
        data: {
          userId: auth.session.user.id,
          clientId: task.clientId,
          entityType: 'automation',
          entityId: setting.id,
          action: 'automation_executed',
          details: JSON.stringify({
            trigger,
            ruleName: ruleData.name,
            boardType,
            taskId,
            taskTitle: task.title,
            actionsExecuted: executedActions.filter((a) => a.ruleId === setting.id).length,
          }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      executedRules: executedActions.filter((a) => a.success).length,
      totalActions: executedActions.length,
      actions: executedActions,
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
