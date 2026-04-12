import { NextResponse } from 'next/server'
import { requireClient } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const { session, companyId, error } = await requireClient()
    if (error) return error

    const updates = await prisma.clientUpdate.findMany({
      where: {
        OR: [
          { companyId: companyId! },
          { companyId: null },
        ]
      },
      include: {
        author: { select: { name: true } },
        reads: { where: { userId: session!.user.id }, select: { readAt: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const result = updates.map((u: typeof updates[number]) => ({
      id: u.id,
      title: u.title,
      content: u.content,
      authorName: u.author.name,
      companyId: u.companyId,
      createdAt: u.createdAt,
      isRead: u.reads.length > 0,
      readAt: u.reads[0]?.readAt ?? null,
    }))

    return NextResponse.json(result)
  } catch (err) {
    console.error('GET /api/updates:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
