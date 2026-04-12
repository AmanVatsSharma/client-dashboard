import { NextResponse } from 'next/server'
import { requireClient } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const { companyId, error } = await requireClient()
    if (error) return error

    const invoices = await prisma.invoice.findMany({
      where: { companyId: companyId! },
      include: {
        service: { select: { name: true, type: true } },
        paymentProofs: {
          select: { id: true, status: true, adminNotes: true, uploadedAt: true },
          orderBy: { uploadedAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(invoices)
  } catch (err) {
    console.error('GET /api/invoices:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
