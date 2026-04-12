import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['ONE_TIME', 'SUBSCRIPTION']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'COMPLETED']),
  price: z.number().positive(),
  nextBilling: z.string().optional().nullable(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    const json = await request.json()
    const parsed = createServiceSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const service = await prisma.service.create({
      data: {
        ...parsed.data,
        nextBilling: parsed.data.nextBilling ? new Date(parsed.data.nextBilling) : null,
        companyId: params.companyId,
        createdById: session!.user.id,
      }
    })

    return NextResponse.json(service, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/companies/[id]/services:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const services = await prisma.service.findMany({
      where: { companyId: params.companyId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(services)
  } catch (err) {
    console.error('GET /api/admin/companies/[id]/services:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
