import { User, Service, Invoice, Ticket, ServiceType, ServiceStatus, InvoiceStatus, TicketStatus, Priority } from '@prisma/client'

export type { User, Service, Invoice, Ticket, ServiceType, ServiceStatus, InvoiceStatus, TicketStatus, Priority }

export interface ExtendedUser extends User {
  services: Service[]
  invoices: Invoice[]
  tickets: Ticket[]
}

export interface ExtendedService extends Service {
  invoices: Invoice[]
  tickets: Ticket[]
}

export interface ExtendedTicket extends Ticket {
  service?: Service
  messages: TicketMessage[]
}

export interface TicketMessage {
  id: string
  message: string
  isAdmin: boolean
  createdAt: Date
}

export interface PaymentSession {
  id: string
  amount: number
  currency: string
  receipt: string
}

export interface ActivityLogEntry {
  id: string
  action: string
  details?: string
  createdAt: Date
}
