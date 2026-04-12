import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const invoiceId = searchParams.get('invoiceId')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (invoiceId) where.invoiceId = invoiceId

    const proofs = await prisma.paymentProof.findMany({
      where,
      select: {
        id: true,
        invoiceId: true,
        companyId: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        status: true,
        adminNotes: true,
        uploadedAt: true,
        reviewedAt: true,
        uploadedBy: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
        invoice: { select: { invoiceNumber: true, amount: true } },
        // fileData excluded from list
      },
      orderBy: { uploadedAt: 'desc' }
    })

    return NextResponse.json(proofs)
  } catch (err) {
    console.error('GET /api/admin/payment-proofs:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
