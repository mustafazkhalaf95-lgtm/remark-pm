import { NextResponse } from 'next/server';
import { requireAuth, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { sendSuccess } from '@/lib/routeHandlers';

// GET — Single budget with calculated fields
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const budget = await prisma.budget.findUnique({ where: { id } });

        if (!budget) {
            return NextResponse.json({ error: 'Budget not found', error_ar: 'الميزانية غير موجودة' }, { status: 404 });
        }

        const enriched = {
            ...budget,
            remaining: budget.allocated - budget.spent,
            percentUsed: budget.allocated > 0 ? Math.round((budget.spent / budget.allocated) * 100) : 0,
        };

        return sendSuccess(enriched);
    } catch (error) {
        return errorToResponse(error);
    }
}

// PUT — Update budget
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const body = await req.json();

        const existing = await prisma.budget.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Budget not found', error_ar: 'الميزانية غير موجودة' }, { status: 404 });
        }

        const updateData: any = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.nameAr !== undefined) updateData.nameAr = body.nameAr;
        if (body.allocated !== undefined) updateData.allocated = body.allocated;
        if (body.spent !== undefined) updateData.spent = body.spent;
        if (body.period !== undefined) updateData.period = body.period;
        if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
        if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.clientId !== undefined) updateData.clientId = body.clientId || null;
        if (body.campaignId !== undefined) updateData.campaignId = body.campaignId || null;

        // Auto-detect exceeded status
        const newAllocated = body.allocated !== undefined ? body.allocated : existing.allocated;
        const newSpent = body.spent !== undefined ? body.spent : existing.spent;
        if (newSpent > newAllocated && body.status === undefined) {
            updateData.status = 'exceeded';
        }

        const budget = await prisma.budget.update({
            where: { id },
            data: updateData,
        });

        const enriched = {
            ...budget,
            remaining: budget.allocated - budget.spent,
            percentUsed: budget.allocated > 0 ? Math.round((budget.spent / budget.allocated) * 100) : 0,
        };

        await logAudit(auth.session.user.id, 'updated', 'budgets', { id, name: budget.name });
        return sendSuccess(enriched);
    } catch (error) {
        return errorToResponse(error);
    }
}

// DELETE — Delete budget
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const existing = await prisma.budget.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Budget not found', error_ar: 'الميزانية غير موجودة' }, { status: 404 });
        }

        await prisma.budget.delete({ where: { id } });

        await logAudit(auth.session.user.id, 'deleted', 'budgets', { id, name: existing.name });
        return sendSuccess({ success: true, id });
    } catch (error) {
        return errorToResponse(error);
    }
}
