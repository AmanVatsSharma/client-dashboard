/**
 * @file invoice-display.ts
 * @module client-dashboard/lib
 * @description Map Prisma invoice status to UI labels (client-safe).
 * @author BharatERP
 * @created 2026-04-09
 */

import type { InvoiceStatus } from '@prisma/client'

export type UiInvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

export function invoiceStatusToUi(status: InvoiceStatus): UiInvoiceStatus {
  switch (status) {
    case 'PENDING':
      return 'pending'
    case 'PAID':
      return 'paid'
    case 'OVERDUE':
      return 'overdue'
    case 'CANCELLED':
      return 'cancelled'
    default:
      return 'pending'
  }
}
