import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.ticketId },
      include: {
        company: { select: { id: true, name: true } },
        openedBy: { select: { id: true, name: true, email: true } },
        service: { select: { name: true } },
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
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    return NextResponse.json(ticket)
  } catch (err) {
    console.error('GET /api/admin/tickets/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const json = await request.json()
    const parsed = updateSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const ticket = await prisma.ticket.update({
      where: { id: params.ticketId },
      data: parsed.data,
    })

    return NextResponse.json(ticket)
  } catch (err) {
    console.error('PATCH /api/admin/tickets/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
