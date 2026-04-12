import { NextRequest, NextResponse } from 'next/server'
import { requireClient } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const { companyId, error } = await requireClient()
    if (error) return error

    const ticket = await prisma.ticket.findFirst({
      where: { id: params.ticketId, companyId: companyId! },
      include: {
        service: { select: { id: true, name: true } },
        openedBy: { select: { id: true, name: true } },
        messages: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
                companyUsers: { select: { jobTitle: true, role: true }, take: 1 }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(ticket)
  } catch (err) {
    console.error('GET /api/tickets/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
