/**
 * @file route.ts
 * @module client-dashboard/api/tickets/[ticketId]/messages
 * @description Append a client message to a ticket owned by the session user.
 * @author BharatERP
 * @created 2026-04-09
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addActivityLog } from '@/lib/activity-log'

export async function POST(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ticketId } = params
    const body = await request.json()
    const message = typeof body.message === 'string' ? body.message.trim() : ''

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, userId: session.user.id }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') {
      return NextResponse.json(
        { error: 'Cannot add messages to a resolved or closed ticket' },
        { status: 400 }
      )
    }

    const created = await prisma.ticketMessage.create({
      data: {
        ticketId,
        message,
        isAdmin: false
      }
    })

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    })

    await addActivityLog(session.user.id, 'Ticket message sent', ticketId)

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Ticket message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
