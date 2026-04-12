import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  bankName: z.string().min(1).optional(),
  accountHolder: z.string().min(1).optional(),
  accountNumber: z.string().min(1).optional(),
  iban: z.string().optional().nullable(),
  swiftCode: z.string().optional().nullable(),
  routingNumber: z.string().optional().nullable(),
  country: z.string().min(1).optional(),
  currency: z.string().min(1).optional(),
  currencySymbol: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const json = await request.json()
    const parsed = updateSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const account = await prisma.bankAccount.update({
      where: { id: params.accountId },
      data: parsed.data,
    })

    return NextResponse.json(account)
  } catch (err) {
    console.error('PATCH /api/admin/bank-accounts/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    await prisma.bankAccount.delete({ where: { id: params.accountId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/bank-accounts/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
