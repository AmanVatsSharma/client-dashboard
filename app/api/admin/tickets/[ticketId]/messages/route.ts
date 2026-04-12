import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const messageSchema = z.object({
  message: z.string().min(1).max(5000),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    const json = await request.json()
    const parsed = messageSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: params.ticketId } })
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const message = await prisma.ticketMessage.create({
      data: {
        message: parsed.data.message,
        isAdmin: true,
        ticketId: params.ticketId,
        authorId: session!.user.id,
      },
      include: {
        author: { select: { id: true, name: true, role: true } }
      }
    })

    // Update ticket status to IN_PROGRESS if it was OPEN
    if (ticket.status === 'OPEN') {
      await prisma.ticket.update({
        where: { id: params.ticketId },
        data: { status: 'IN_PROGRESS' }
      })
    }

    return NextResponse.json(message, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/tickets/[id]/messages:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
