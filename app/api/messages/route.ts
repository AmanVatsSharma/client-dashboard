import { NextRequest, NextResponse } from 'next/server'
import { requireClient } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const messageSchema = z.object({
  message: z.string().min(1).max(5000),
  toUserId: z.string().min(1),
})

export async function GET() {
  try {
    const { session, error } = await requireClient()
    if (error) return error

    const userId = session!.user.id

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }]
      },
      include: {
        from: { select: { id: true, name: true, role: true } },
        to: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' }
    })

    // Mark messages sent to this user as read
    await prisma.directMessage.updateMany({
      where: { toUserId: userId, isRead: false },
      data: { isRead: true }
    })

    return NextResponse.json(messages)
  } catch (err) {
    console.error('GET /api/messages:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireClient()
    if (error) return error

    const json = await request.json()
    const parsed = messageSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    // Verify recipient is an admin
    const recipient = await prisma.user.findUnique({
      where: { id: parsed.data.toUserId, role: 'ADMIN' }
    })
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    const msg = await prisma.directMessage.create({
      data: {
        fromUserId: session!.user.id,
        toUserId: parsed.data.toUserId,
        message: parsed.data.message,
      },
      include: {
        from: { select: { id: true, name: true, role: true } },
        to: { select: { id: true, name: true, role: true } },
      }
    })

    return NextResponse.json(msg, { status: 201 })
  } catch (err) {
    console.error('POST /api/messages:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
