/**
 * @file route.ts
 * @module client-dashboard/api/invoices/[invoiceId]
 * @description Single invoice GET and session-scoped PATCH (mark paid / cancel).
 * @author BharatERP
 * @created 2026-04-09
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addActivityLog } from '@/lib/activity-log'
import { invoicePatchBodySchema } from '@/lib/schemas/api'
import { resolveInvoicePatch } from '@/lib/invoice-transitions'

export async function GET(
  _request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: params.invoiceId, userId: session.user.id },
      include: {
        service: { select: { name: true, type: true } }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Invoice get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json()
    const parsed = invoicePatchBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const existing = await prisma.invoice.findFirst({
      where: { id: params.invoiceId, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const resolved = resolveInvoicePatch(existing.status, parsed.data.status)
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.message }, { status: 400 })
    }

    const updated = await prisma.invoice.update({
      where: { id: existing.id },
      data: {
        status: resolved.nextStatus,
        paidAt: resolved.paidAt
      },
      include: {
        service: { select: { name: true, type: true } }
      }
    })

    await addActivityLog(
      session.user.id,
      parsed.data.status === 'PAID' ? 'Invoice marked paid' : 'Invoice cancelled',
      updated.invoiceNumber
    )

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Invoice patch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
