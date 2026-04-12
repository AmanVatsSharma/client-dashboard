import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { updateId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    await prisma.clientUpdate.delete({ where: { id: params.updateId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/updates/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
