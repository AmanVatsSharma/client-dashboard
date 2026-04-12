import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createInvoiceSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
  dueDate: z.string(),
  serviceId: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).default('PENDING'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    const json = await request.json()
    const parsed = createInvoiceSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    // Generate invoice number
    const count = await prisma.invoice.count()
    const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`

    const invoice = await prisma.invoice.create({
      data: {
        ...parsed.data,
        invoiceNumber,
        dueDate: new Date(parsed.data.dueDate),
        companyId: params.companyId,
        createdById: session!.user.id,
      }
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/companies/[id]/invoices:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const invoices = await prisma.invoice.findMany({
      where: { companyId: params.companyId },
      include: {
        service: { select: { name: true } },
        paymentProofs: { select: { id: true, status: true, fileName: true, uploadedAt: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(invoices)
  } catch (err) {
    console.error('GET /api/admin/companies/[id]/invoices:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
