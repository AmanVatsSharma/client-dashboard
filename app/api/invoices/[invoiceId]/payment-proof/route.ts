import { NextRequest, NextResponse } from 'next/server'
import { requireClient } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const uploadSchema = z.object({
  fileName: z.string().min(1),
  fileData: z.string().min(1),  // base64
  fileType: z.string().refine((t) => ALLOWED_TYPES.includes(t), {
    message: 'File type not allowed. Use JPEG, PNG, WebP, or PDF.'
  }),
  fileSize: z.number().max(MAX_FILE_SIZE, 'File must be smaller than 5MB'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const { session, companyId, error } = await requireClient()
    if (error) return error

    // Verify invoice belongs to this company
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.invoiceId, companyId: companyId! }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (!['PENDING', 'OVERDUE'].includes(invoice.status)) {
      return NextResponse.json({ error: 'Payment proof can only be uploaded for pending or overdue invoices' }, { status: 400 })
    }

    const json = await request.json()
    const parsed = uploadSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    // Check no existing PENDING proof
    const existingPending = await prisma.paymentProof.findFirst({
      where: { invoiceId: params.invoiceId, status: 'PENDING' }
    })
    if (existingPending) {
      return NextResponse.json({ error: 'A proof of payment is already pending review for this invoice' }, { status: 400 })
    }

    const proof = await prisma.paymentProof.create({
      data: {
        invoiceId: params.invoiceId,
        companyId: companyId!,
        uploadedById: session!.user.id,
        fileName: parsed.data.fileName,
        fileData: parsed.data.fileData,
        fileType: parsed.data.fileType,
        fileSize: parsed.data.fileSize,
      }
    })

    return NextResponse.json({ id: proof.id, status: proof.status }, { status: 201 })
  } catch (err) {
    console.error('POST /api/invoices/[id]/payment-proof:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const { companyId, error } = await requireClient()
    if (error) return error

    const proof = await prisma.paymentProof.findFirst({
      where: { invoiceId: params.invoiceId, companyId: companyId! },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        status: true,
        adminNotes: true,
        uploadedAt: true,
        reviewedAt: true,
      }
    })

    return NextResponse.json(proof)
  } catch (err) {
    console.error('GET /api/invoices/[id]/payment-proof:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
