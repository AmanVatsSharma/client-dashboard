import { NextRequest, NextResponse } from 'next/server'
import { requireClient } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const { companyId, error } = await requireClient()
    if (error) return error

    const invoice = await prisma.invoice.findFirst({
      where: { id: params.invoiceId, companyId: companyId! },
      include: {
        service: { select: { name: true, type: true } },
        paymentProofs: {
          select: { id: true, status: true, adminNotes: true, uploadedAt: true },
          orderBy: { uploadedAt: 'desc' },
          take: 1
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (err) {
    console.error('GET /api/invoices/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
