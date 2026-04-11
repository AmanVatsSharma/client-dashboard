/**
 * @file ticket-display.ts
 * @module client-dashboard/lib
 * @description Map Prisma ticket enums to UI labels used by support pages (client-safe).
 * @author BharatERP
 * @created 2026-04-09
 */

import type { Priority, TicketStatus } from '@prisma/client'

export type UiTicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed'

export function ticketStatusToUi(status: TicketStatus): UiTicketStatus {
  switch (status) {
    case 'OPEN':
      return 'open'
    case 'IN_PROGRESS':
      return 'in-progress'
    case 'RESOLVED':
      return 'resolved'
    case 'CLOSED':
      return 'closed'
    default:
      return 'open'
  }
}

export function priorityToUi(priority: Priority): string {
  return priority.toLowerCase()
}
