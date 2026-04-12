import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const messageSchema = z.object({
  message: z.string().min(1).max(5000),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    const adminId = session!.user.id

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { fromUserId: adminId, toUserId: params.userId },
          { fromUserId: params.userId, toUserId: adminId },
        ]
      },
      include: {
        from: { select: { id: true, name: true, role: true } },
        to: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' }
    })

    // Mark messages from client as read
    await prisma.directMessage.updateMany({
      where: { fromUserId: params.userId, toUserId: adminId, isRead: false },
      data: { isRead: true }
    })

    return NextResponse.json(messages)
  } catch (err) {
    console.error('GET /api/admin/messages/[userId]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    const json = await request.json()
    const parsed = messageSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const msg = await prisma.directMessage.create({
      data: {
        fromUserId: session!.user.id,
        toUserId: params.userId,
        message: parsed.data.message,
      },
      include: {
        from: { select: { id: true, name: true, role: true } },
        to: { select: { id: true, name: true, role: true } },
      }
    })

    return NextResponse.json(msg, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/messages/[userId]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
