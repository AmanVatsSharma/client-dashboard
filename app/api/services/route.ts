import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const services = await prisma.service.findMany({
      where: { userId: session.user.id },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        tickets: {
          where: { status: { not: 'CLOSED' } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Services fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, type, price, nextBilling } = await request.json()

    const service = await prisma.service.create({
      data: {
        name,
        description,
        type,
        price,
        nextBilling: nextBilling ? new Date(nextBilling) : null,
        status: 'PENDING',
        userId: session.user.id
      }
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Service creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
