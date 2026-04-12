import { NextResponse } from 'next/server'
import { requireClient } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const { companyId, error } = await requireClient()
    if (error) return error

    const services = await prisma.service.findMany({
      where: { companyId: companyId! },
      include: {
        _count: { select: { invoices: true, tickets: true } },
        invoices: { orderBy: { createdAt: 'desc' }, take: 5 },
        tickets: { where: { status: { not: 'CLOSED' } }, orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(services)
  } catch (err) {
    console.error('GET /api/services:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
