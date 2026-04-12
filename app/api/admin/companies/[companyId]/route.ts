import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  domain: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const company = await prisma.company.findUnique({
      where: { id: params.companyId },
      include: {
        users: {
          include: { user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } } },
          orderBy: { joinedAt: 'asc' }
        },
        services: { orderBy: { createdAt: 'desc' } },
        invoices: {
          include: {
            paymentProofs: { select: { id: true, status: true, fileName: true, uploadedAt: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        tickets: {
          include: {
            openedBy: { select: { name: true } },
            _count: { select: { messages: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        notes: { orderBy: { createdAt: 'desc' } },
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (err) {
    console.error('GET /api/admin/companies/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const json = await request.json()
    const parsed = updateSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const company = await prisma.company.update({
      where: { id: params.companyId },
      data: parsed.data,
    })

    return NextResponse.json(company)
  } catch (err) {
    console.error('PATCH /api/admin/companies/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
