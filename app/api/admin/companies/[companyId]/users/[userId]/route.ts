import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  role: z.enum(['OWNER', 'MANAGER', 'MEMBER', 'VIEWER']).optional(),
  jobTitle: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { companyId: string; userId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const json = await request.json()
    const parsed = updateSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const companyUser = await prisma.companyUser.update({
      where: { userId_companyId: { userId: params.userId, companyId: params.companyId } },
      data: parsed.data,
      include: { user: { select: { id: true, name: true, email: true } } }
    })

    return NextResponse.json(companyUser)
  } catch (err) {
    console.error('PATCH /api/admin/companies/[id]/users/[uid]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
