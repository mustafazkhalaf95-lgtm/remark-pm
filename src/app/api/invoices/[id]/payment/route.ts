import { NextResponse } from 'next/server';
import { requireAuth, logAudit } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorToResponse } from '@/lib/apiError';
import { sendSuccess } from '@/lib/routeHandlers';

// POST — Record a payment against an invoice
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { id } = await params;
        const body = await req.json();
        const { amount, method, reference, notes, paidAt } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: 'A positive payment amount is required', error_ar: 'مبلغ الدفعة مطلوب وموجب' },
                { status: 400 }
            );
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { payments: true },
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found', error_ar: 'الفاتورة غير موجودة' }, { status: 404 });
        }

        if (invoice.status === 'cancelled') {
            return NextResponse.json(
                { error: 'Cannot record payment on cancelled invoice', error_ar: 'لا يمكن تسجيل دفعة على فاتورة ملغاة' },
                { status: 400 }
            );
        }

        // Create the payment
        const payment = await prisma.payment.create({
            data: {
                invoiceId: id,
                amount,
                method: method || 'bank_transfer',
                reference: reference || '',
                notes: notes || '',
                paidAt: paidAt ? new Date(paidAt) : new Date(),
                recordedBy: auth.session.user.id,
            },
        });

        // Check if invoice is fully paid
        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + amount;
        const updateData: any = {};

        if (totalPaid >= invoice.total) {
            updateData.status = 'paid';
            updateData.paidAt = new Date();
        } else if (invoice.status === 'draft') {
            // Move from draft to sent if partial payment received
            updateData.status = 'sent';
        }

        if (Object.keys(updateData).length > 0) {
            await prisma.invoice.update({ where: { id }, data: updateData });
        }

        // Return updated invoice
        const updatedInvoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                client: { select: { id: true, name: true, nameAr: true, avatar: true } },
                items: { orderBy: { sortOrder: 'asc' } },
                payments: { orderBy: { paidAt: 'desc' } },
            },
        });

        await logAudit(auth.session.user.id, 'payment_recorded', 'invoices', {
            invoiceId: id,
            paymentId: payment.id,
            amount,
            method: method || 'bank_transfer',
        });

        return sendSuccess(updatedInvoice, 201);
    } catch (error) {
        return errorToResponse(error);
    }
}
