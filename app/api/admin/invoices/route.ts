import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const status = searchParams.get('status')
    const hasProof = searchParams.get('hasProof')

    const where: Prisma.InvoiceWhereInput = {}
    if (companyId) where.companyId = companyId
    if (status) where.status = status as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
    if (hasProof === 'true') where.paymentProofs = { some: { status: 'PENDING' } }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        service: { select: { name: true } },
        paymentProofs: {
          select: { id: true, status: true, fileName: true, uploadedAt: true, uploadedBy: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(invoices)
  } catch (err) {
    console.error('GET /api/admin/invoices:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
