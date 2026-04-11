/**
 * @file route.ts
 * @module client-dashboard/api/tickets/[ticketId]
 * @description Fetch a single ticket with messages for the signed-in user.
 * @author BharatERP
 * @created 2026-04-09
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ticketId } = params

    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, userId: session.user.id },
      include: {
        service: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: 'asc' } }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Ticket fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
