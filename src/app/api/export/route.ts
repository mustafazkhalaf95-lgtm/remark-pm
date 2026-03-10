import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// CSV generation helper
function toCSV(headers: string[], rows: string[][]): string {
    const escape = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
    const headerRow = headers.map(escape).join(',');
    const dataRows = rows.map(row => row.map(escape).join(','));
    return '\uFEFF' + [headerRow, ...dataRows].join('\n'); // BOM for Excel Arabic support
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // clients, invoices, timesheet, tasks, expenses
    const format = searchParams.get('format') || 'csv'; // csv, json
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    try {
        let data: any = {};
        let csvContent = '';
        let filename = '';

        switch (type) {
            case 'clients': {
                const clients = await prisma.client.findMany({
                    where: { status: clientId ? undefined : 'active' },
                    include: { _count: { select: { marketingTasks: true, creativeRequests: true, productionJobs: true, publishingItems: true } } },
                });
                if (format === 'csv') {
                    const headers = ['الاسم', 'Name', 'القطاع', 'الخطة', 'الميزانية', 'الحالة', 'مهام تسويق', 'طلبات إبداعية', 'مشاريع إنتاج', 'منشورات'];
                    const rows = clients.map(c => [c.nameAr || '', c.name, c.sectorAr || c.sector, c.planType, c.budget, c.status, String(c._count.marketingTasks), String(c._count.creativeRequests), String(c._count.productionJobs), String(c._count.publishingItems)]);
                    csvContent = toCSV(headers, rows);
                    filename = 'clients-export.csv';
                } else { data = clients; filename = 'clients-export.json'; }
                break;
            }
            case 'invoices': {
                const where: any = {};
                if (clientId) where.clientId = clientId;
                if (startDate) where.issueDate = { gte: new Date(startDate) };
                const invoices = await prisma.invoice.findMany({ where, include: { client: true, items: true, payments: true }, orderBy: { issueDate: 'desc' } });
                if (format === 'csv') {
                    const headers = ['رقم الفاتورة', 'العميل', 'المبلغ', 'الضريبة', 'الإجمالي', 'الحالة', 'تاريخ الإصدار', 'تاريخ الاستحقاق', 'المدفوع'];
                    const rows = invoices.map(inv => [inv.number, inv.client?.nameAr || inv.client?.name || '', String(inv.subtotal), String(inv.taxAmount), String(inv.total), inv.status, inv.issueDate.toISOString().split('T')[0], inv.dueDate.toISOString().split('T')[0], String(inv.payments.reduce((s, p) => s + p.amount, 0))]);
                    csvContent = toCSV(headers, rows);
                    filename = 'invoices-export.csv';
                } else { data = invoices; filename = 'invoices-export.json'; }
                break;
            }
            case 'timesheet': {
                const where: any = { status: 'completed' };
                if (startDate) where.startTime = { gte: new Date(startDate) };
                if (endDate) where.startTime = { ...where.startTime, lte: new Date(endDate) };
                const entries = await prisma.timeEntry.findMany({ where, include: { user: { include: { profile: true } } }, orderBy: { startTime: 'desc' } });
                if (format === 'csv') {
                    const headers = ['الموظف', 'التاريخ', 'المدة (ساعات)', 'الوصف', 'نوع المهمة', 'قابل للفوترة'];
                    const rows = entries.map(e => [e.user?.profile?.fullNameAr || '', e.startTime.toISOString().split('T')[0], String((e.duration / 60).toFixed(2)), e.description || e.descriptionAr, e.taskType, e.billable ? 'نعم' : 'لا']);
                    csvContent = toCSV(headers, rows);
                    filename = 'timesheet-export.csv';
                } else { data = entries; filename = 'timesheet-export.json'; }
                break;
            }
            case 'expenses': {
                const where: any = {};
                if (startDate) where.date = { gte: new Date(startDate) };
                if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
                const expenses = await prisma.expense.findMany({ where, orderBy: { date: 'desc' } });
                if (format === 'csv') {
                    const headers = ['التاريخ', 'الفئة', 'الوصف', 'المبلغ', 'العملة', 'الحالة'];
                    const rows = expenses.map(e => [e.date.toISOString().split('T')[0], e.category, e.descriptionAr || e.description, String(e.amount), e.currency, e.status]);
                    csvContent = toCSV(headers, rows);
                    filename = 'expenses-export.csv';
                } else { data = expenses; filename = 'expenses-export.json'; }
                break;
            }
            case 'tasks': {
                const [mt, cr, pj, pi] = await Promise.all([
                    prisma.marketingTask.findMany({ include: { client: true } }),
                    prisma.creativeRequest.findMany({ include: { client: true } }),
                    prisma.productionJob.findMany({ include: { client: true } }),
                    prisma.publishingItem.findMany({ include: { client: true } }),
                ]);
                if (format === 'csv') {
                    const headers = ['البورد', 'العنوان', 'العميل', 'الحالة', 'الأولوية', 'تاريخ الإنشاء'];
                    const rows = [
                        ...mt.map(t => ['تسويق', t.titleAr || t.title, t.client?.nameAr || '', t.status, t.priority, t.createdAt.toISOString().split('T')[0]]),
                        ...cr.map(t => ['إبداعي', t.titleAr || t.title, t.client?.nameAr || '', t.status, t.priority, t.createdAt.toISOString().split('T')[0]]),
                        ...pj.map(t => ['إنتاج', t.titleAr || t.title, t.client?.nameAr || '', t.status, t.priority, t.createdAt.toISOString().split('T')[0]]),
                        ...pi.map(t => ['نشر', t.titleAr || t.title, t.client?.nameAr || '', t.status, '', t.createdAt.toISOString().split('T')[0]]),
                    ];
                    csvContent = toCSV(headers, rows);
                    filename = 'tasks-export.csv';
                } else { data = { marketing: mt, creative: cr, production: pj, publishing: pi }; filename = 'tasks-export.json'; }
                break;
            }
            default:
                return NextResponse.json({ error: 'Invalid export type. Use: clients, invoices, timesheet, expenses, tasks' }, { status: 400 });
        }

        if (format === 'csv') {
            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                },
            });
        }
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
