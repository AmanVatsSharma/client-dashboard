import { NextRequest, NextResponse } from 'next/server'
import { requireClient } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'

export async function POST(
  _req: NextRequest,
  { params }: { params: { updateId: string } }
) {
  try {
    const { session, error } = await requireClient()
    if (error) return error

    await prisma.clientUpdateRead.upsert({
      where: { updateId_userId: { updateId: params.updateId, userId: session!.user.id } },
      create: { updateId: params.updateId, userId: session!.user.id },
      update: { readAt: new Date() }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/updates/[id]/read:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
