/**
 * @file route.ts
 * @module client-dashboard/api/tickets
 * @description Session-scoped list and create for support tickets (Prisma).
 * @author BharatERP
 * @created 2026-04-09
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { Priority } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addActivityLog } from '@/lib/activity-log'

const PRIORITIES = new Set<Priority>(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tickets = await prisma.ticket.findMany({
      where: { userId: session.user.id },
      include: {
        service: { select: { id: true, name: true } },
        messages: { select: { id: true }, take: 1 }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Tickets fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const serviceId =
      typeof body.serviceId === 'string' && body.serviceId.length > 0 ? body.serviceId : null
    const priorityRaw = body.priority
    const priority: Priority =
      typeof priorityRaw === 'string' && PRIORITIES.has(priorityRaw as Priority)
        ? (priorityRaw as Priority)
        : 'MEDIUM'

    if (!title || !description) {
      return NextResponse.json(
        { error: 'title and description are required' },
        { status: 400 }
      )
    }

    if (serviceId) {
      const service = await prisma.service.findFirst({
        where: { id: serviceId, userId: session.user.id }
      })
      if (!service) {
        return NextResponse.json({ error: 'Invalid service' }, { status: 400 })
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority,
        userId: session.user.id,
        serviceId
      },
      include: {
        service: { select: { id: true, name: true } },
        messages: true
      }
    })

    await addActivityLog(session.user.id, 'Ticket created', ticket.id)

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Ticket creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
