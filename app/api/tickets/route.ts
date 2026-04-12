import { NextRequest, NextResponse } from 'next/server'
import { requireClient } from '@/lib/admin-guard'
import { Priority } from '@prisma/client'
import { prisma } from '@/lib/db'

const PRIORITIES = new Set<Priority>(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

export async function GET() {
  try {
    const { companyId, error } = await requireClient()
    if (error) return error

    const tickets = await prisma.ticket.findMany({
      where: { companyId: companyId! },
      include: {
        service: { select: { id: true, name: true } },
        openedBy: { select: { id: true, name: true } },
        _count: { select: { messages: true } }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(tickets)
  } catch (err) {
    console.error('GET /api/tickets:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, companyId, error } = await requireClient()
    if (error) return error

    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const serviceId = typeof body.serviceId === 'string' && body.serviceId.length > 0 ? body.serviceId : null
    const priorityRaw = body.priority
    const priority: Priority =
      typeof priorityRaw === 'string' && PRIORITIES.has(priorityRaw as Priority)
        ? (priorityRaw as Priority)
        : 'MEDIUM'

    if (!title || !description) {
      return NextResponse.json({ error: 'title and description are required' }, { status: 400 })
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority,
        companyId: companyId!,
        openedById: session!.user.id,
        serviceId,
      },
      include: {
        service: { select: { id: true, name: true } },
        openedBy: { select: { id: true, name: true } },
      }
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (err) {
    console.error('POST /api/tickets:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
