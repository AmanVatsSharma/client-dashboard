import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  adminNotes: z.string().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { proofId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const proof = await prisma.paymentProof.findUnique({
      where: { id: params.proofId },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
        invoice: { select: { invoiceNumber: true, amount: true, status: true } },
      }
    })

    if (!proof) {
      return NextResponse.json({ error: 'Proof not found' }, { status: 404 })
    }

    return NextResponse.json(proof)
  } catch (err) {
    console.error('GET /api/admin/payment-proofs/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { proofId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const json = await request.json()
    const parsed = updateSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const proof = await prisma.paymentProof.update({
      where: { id: params.proofId },
      data: {
        status: parsed.data.status,
        adminNotes: parsed.data.adminNotes,
        reviewedAt: new Date(),
      }
    })

    // Auto-mark invoice as PAID when proof approved
    if (parsed.data.status === 'APPROVED') {
      await prisma.invoice.update({
        where: { id: proof.invoiceId },
        data: { status: 'PAID', paidAt: new Date() }
      })
    }

    return NextResponse.json(proof)
  } catch (err) {
    console.error('PATCH /api/admin/payment-proofs/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
