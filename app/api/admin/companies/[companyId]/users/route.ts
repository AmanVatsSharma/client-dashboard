import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const addUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(['OWNER', 'MANAGER', 'MEMBER', 'VIEWER']).default('MEMBER'),
  jobTitle: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const json = await request.json()
    const parsed = addUserSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const { name, email, password, phone, role, jobTitle } = parsed.data

    const company = await prisma.company.findUnique({ where: { id: params.companyId } })
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      // Check if already in this company
      const existingMembership = await prisma.companyUser.findUnique({
        where: { userId_companyId: { userId: existingUser.id, companyId: params.companyId } }
      })
      if (existingMembership) {
        return NextResponse.json({ error: 'User already belongs to this company' }, { status: 400 })
      }
      // Add existing user to company
      const companyUser = await prisma.companyUser.create({
        data: { userId: existingUser.id, companyId: params.companyId, role, jobTitle },
        include: { user: { select: { id: true, name: true, email: true, phone: true } } }
      })
      return NextResponse.json(companyUser, { status: 201 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, password: hashedPassword, phone, role: 'CLIENT' }
      })
      const companyUser = await tx.companyUser.create({
        data: { userId: user.id, companyId: params.companyId, role, jobTitle },
        include: { user: { select: { id: true, name: true, email: true, phone: true } } }
      })
      return companyUser
    })

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/companies/[id]/users:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
