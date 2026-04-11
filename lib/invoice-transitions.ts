/**
 * @file invoice-transitions.ts
 * @module client-dashboard/lib
 * @description Pure rules for client-requested invoice status changes (testable).
 * @author BharatERP
 * @created 2026-04-09
 */

import type { InvoiceStatus } from '@prisma/client'

export type InvoicePatchStatus = 'PAID' | 'CANCELLED'

export function resolveInvoicePatch(
  current: InvoiceStatus,
  requested: InvoicePatchStatus
): { ok: true; nextStatus: InvoiceStatus; paidAt: Date | null } | { ok: false; message: string } {
  if (requested === 'PAID') {
    if (current === 'PENDING' || current === 'OVERDUE') {
      return { ok: true, nextStatus: 'PAID', paidAt: new Date() }
    }
    if (current === 'PAID') {
      return { ok: false, message: 'Invoice is already paid' }
    }
    return { ok: false, message: 'Only pending or overdue invoices can be marked paid' }
  }

  if (requested === 'CANCELLED') {
    if (current === 'PENDING') {
      return { ok: true, nextStatus: 'CANCELLED', paidAt: null }
    }
    if (current === 'CANCELLED') {
      return { ok: false, message: 'Invoice is already cancelled' }
    }
    return { ok: false, message: 'Only pending invoices can be cancelled' }
  }

  return { ok: false, message: 'Invalid transition' }
}
