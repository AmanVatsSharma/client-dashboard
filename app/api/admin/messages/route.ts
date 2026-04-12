import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    const adminId = session!.user.id

    // Get all unique users who have DM'd this admin or been DM'd
    const conversations = await prisma.directMessage.findMany({
      where: {
        OR: [{ fromUserId: adminId }, { toUserId: adminId }]
      },
      include: {
        from: { select: { id: true, name: true, email: true, companyUsers: { include: { company: { select: { name: true } } }, take: 1 } } },
        to: { select: { id: true, name: true, email: true, companyUsers: { include: { company: { select: { name: true } } }, take: 1 } } },
      },
      orderBy: { createdAt: 'desc' }
    })

    // Deduplicate by other user, keep latest message per conversation
    const seen = new Map<string, typeof conversations[0]>()
    for (const msg of conversations) {
      const otherId = msg.fromUserId === adminId ? msg.toUserId : msg.fromUserId
      if (!seen.has(otherId)) seen.set(otherId, msg)
    }

    const result = Array.from(seen.entries()).map(([otherId, lastMsg]) => {
      const otherUser = lastMsg.fromUserId === adminId ? lastMsg.to : lastMsg.from
      return { userId: otherId, user: otherUser, lastMessage: lastMsg }
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('GET /api/admin/messages:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
