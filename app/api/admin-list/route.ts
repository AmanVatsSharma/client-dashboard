import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(admins)
  } catch (err) {
    console.error('GET /api/admin-list:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
