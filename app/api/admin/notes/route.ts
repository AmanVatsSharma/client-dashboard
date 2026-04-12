import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  companyId: z.string().optional().nullable(),
  isPrivate: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    const notes = await prisma.note.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        author: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(notes)
  } catch (err) {
    console.error('GET /api/admin/notes:', err)
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

    const note = await prisma.note.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        companyId: parsed.data.companyId ?? null,
        isPrivate: parsed.data.isPrivate,
        authorId: session!.user.id,
      },
      include: {
        author: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json(note, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/notes:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
