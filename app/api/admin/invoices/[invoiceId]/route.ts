import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  dueDate: z.string().optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional().nullable(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.invoiceId },
      include: {
        company: { select: { id: true, name: true } },
        service: { select: { name: true } },
        paymentProofs: {
          include: { uploadedBy: { select: { id: true, name: true, email: true } } },
          orderBy: { uploadedAt: 'desc' }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (err) {
    console.error('GET /api/admin/invoices/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const json = await request.json()
    const parsed = updateSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const data: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.dueDate) data.dueDate = new Date(parsed.data.dueDate)
    if (parsed.data.status === 'PAID') data.paidAt = new Date()

    const invoice = await prisma.invoice.update({
      where: { id: params.invoiceId },
      data,
    })

    return NextResponse.json(invoice)
  } catch (err) {
    console.error('PATCH /api/admin/invoices/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
