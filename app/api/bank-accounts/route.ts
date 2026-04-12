import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accounts = await prisma.bankAccount.findMany({
      where: { isActive: true },
      orderBy: [{ country: 'asc' }, { sortOrder: 'asc' }],
      select: {
        id: true,
        name: true,
        bankName: true,
        accountHolder: true,
        accountNumber: true,
        iban: true,
        swiftCode: true,
        routingNumber: true,
        country: true,
        currency: true,
        currencySymbol: true,
      }
    })

    return NextResponse.json(accounts)
  } catch (err) {
    console.error('GET /api/bank-accounts:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
