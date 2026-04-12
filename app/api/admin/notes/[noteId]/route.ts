import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  isPrivate: z.boolean().optional(),
  companyId: z.string().optional().nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const json = await request.json()
    const parsed = updateSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const note = await prisma.note.update({
      where: { id: params.noteId },
      data: parsed.data,
    })

    return NextResponse.json(note)
  } catch (err) {
    console.error('PATCH /api/admin/notes/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    await prisma.note.delete({ where: { id: params.noteId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/notes/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
