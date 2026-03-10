import { NextResponse } from 'next/server';
import { requireAuth, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { sendSuccess } from '@/lib/routeHandlers';

// GET — Single expense
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const expense = await prisma.expense.findUnique({ where: { id } });

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found', error_ar: 'المصروف غير موجود' }, { status: 404 });
        }

        return sendSuccess(expense);
    } catch (error) {
        return errorToResponse(error);
    }
}

// PUT — Update expense
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const body = await req.json();

        const existing = await prisma.expense.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Expense not found', error_ar: 'المصروف غير موجود' }, { status: 404 });
        }

        const updateData: any = {};
        if (body.category !== undefined) updateData.category = body.category;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.descriptionAr !== undefined) updateData.descriptionAr = body.descriptionAr;
        if (body.amount !== undefined) updateData.amount = body.amount;
        if (body.currency !== undefined) updateData.currency = body.currency;
        if (body.date !== undefined) updateData.date = new Date(body.date);
        if (body.receiptUrl !== undefined) updateData.receiptUrl = body.receiptUrl;
        if (body.clientId !== undefined) updateData.clientId = body.clientId || null;
        if (body.campaignId !== undefined) updateData.campaignId = body.campaignId || null;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.status === 'approved') updateData.approvedBy = auth.session.user.id;

        const expense = await prisma.expense.update({
            where: { id },
            data: updateData,
        });

        await logAudit(auth.session.user.id, 'updated', 'expenses', { id, category: expense.category });
        return sendSuccess(expense);
    } catch (error) {
        return errorToResponse(error);
    }
}

// DELETE — Delete expense
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const existing = await prisma.expense.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Expense not found', error_ar: 'المصروف غير موجود' }, { status: 404 });
        }

        await prisma.expense.delete({ where: { id } });

        await logAudit(auth.session.user.id, 'deleted', 'expenses', { id, category: existing.category, amount: existing.amount });
        return sendSuccess({ success: true, id });
    } catch (error) {
        return errorToResponse(error);
    }
}
