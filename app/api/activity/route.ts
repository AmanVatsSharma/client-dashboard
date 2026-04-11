/**
 * @file route.ts
 * @module client-dashboard/api/activity
 * @description Paginated activity log for the signed-in user.
 * @author BharatERP
 * @created 2026-04-09
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const querySchema = z.object({
  take: z.coerce.number().min(1).max(50).default(20),
  skip: z.coerce.number().min(0).default(0)
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      take: searchParams.get('take') ?? undefined,
      skip: searchParams.get('skip') ?? undefined
    })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
    }

    const { take, skip } = parsed.data

    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          action: true,
          details: true,
          createdAt: true
        }
      }),
      prisma.activityLog.count({ where: { userId: session.user.id } })
    ])

    return NextResponse.json({
      items,
      total,
      take,
      skip,
      hasMore: skip + items.length < total
    })
  } catch (error) {
    console.error('Activity list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
