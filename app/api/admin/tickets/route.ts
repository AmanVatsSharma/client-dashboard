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
    const priority = searchParams.get('priority')

    const where: Prisma.TicketWhereInput = {}
    if (companyId) where.companyId = companyId
    if (status) where.status = status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
    if (priority) where.priority = priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        openedBy: { select: { id: true, name: true } },
        service: { select: { name: true } },
        _count: { select: { messages: true } }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(tickets)
  } catch (err) {
    console.error('GET /api/admin/tickets:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
