import { NextResponse } from 'next/server'
import { requireClient } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const { companyId, error } = await requireClient()
    if (error) return error

    const notes = await prisma.note.findMany({
      where: {
        companyId: companyId!,
        isPrivate: false,
      },
      include: {
        author: { select: { name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(notes)
  } catch (err) {
    console.error('GET /api/notes:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
