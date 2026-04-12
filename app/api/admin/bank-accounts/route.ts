import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  bankName: z.string().min(1),
  accountHolder: z.string().min(1),
  accountNumber: z.string().min(1),
  iban: z.string().optional(),
  swiftCode: z.string().optional(),
  routingNumber: z.string().optional(),
  country: z.string().min(1),
  currency: z.string().min(1),
  currencySymbol: z.string().min(1),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const accounts = await prisma.bankAccount.findMany({
      orderBy: [{ country: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }]
    })

    return NextResponse.json(accounts)
  } catch (err) {
    console.error('GET /api/admin/bank-accounts:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const json = await request.json()
    const parsed = createSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const account = await prisma.bankAccount.create({ data: parsed.data })
    return NextResponse.json(account, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/bank-accounts:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
