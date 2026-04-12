import { NextRequest, NextResponse } from 'next/server'
import { requireClient } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const { session, companyId, error } = await requireClient()
    if (error) return error

    const body = await request.json()
    const message = typeof body.message === 'string' ? body.message.trim() : ''

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    const ticket = await prisma.ticket.findFirst({
      where: { id: params.ticketId, companyId: companyId! }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') {
      return NextResponse.json({ error: 'Cannot add messages to a resolved or closed ticket' }, { status: 400 })
    }

    const created = await prisma.ticketMessage.create({
      data: {
        ticketId: params.ticketId,
        message,
        isAdmin: false,
        authorId: session!.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            companyUsers: { select: { jobTitle: true, role: true }, take: 1 }
          }
        }
      }
    })

    await prisma.ticket.update({
      where: { id: params.ticketId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('POST /api/tickets/[id]/messages:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
