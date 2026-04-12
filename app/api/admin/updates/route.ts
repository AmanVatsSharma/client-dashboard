import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  companyId: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const updates = await prisma.clientUpdate.findMany({
      include: {
        author: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        _count: { select: { reads: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(updates)
  } catch (err) {
    console.error('GET /api/admin/updates:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    const json = await request.json()
    const parsed = createSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const update = await prisma.clientUpdate.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        companyId: parsed.data.companyId ?? null,
        authorId: session!.user.id,
      },
      include: {
        author: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json(update, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/updates:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
