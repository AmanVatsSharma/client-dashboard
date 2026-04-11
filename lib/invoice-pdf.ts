/**
 * @file invoice-pdf.ts
 * @module client-dashboard/lib
 * @description Client-side PDF export for a single invoice (dynamic jsPDF import).
 * @author BharatERP
 * @created 2026-04-09
 */

import { formatCurrency, formatDate } from '@/lib/utils'

export type InvoicePdfPayload = {
  invoiceNumber: string
  amount: number
  status: string
  dueDate: string
  createdAt: string
  paidAt: string | null
  service: { name: string } | null
  description: string | null
}

export async function downloadInvoicePdf(invoice: InvoicePdfPayload): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const line = (y: number, text: string) => {
    doc.text(text, 14, y)
    return y + 8
  }
  let y = 16
  doc.setFontSize(16)
  y = line(y, 'Vedpragya Bharat — Invoice')
  doc.setFontSize(11)
  y = line(y, `Invoice #: ${invoice.invoiceNumber}`)
  y = line(y, `Amount: ${formatCurrency(invoice.amount)}`)
  y = line(y, `Status: ${invoice.status}`)
  y = line(y, `Due: ${formatDate(invoice.dueDate)}`)
  y = line(y, `Issued: ${formatDate(invoice.createdAt)}`)
  if (invoice.paidAt) {
    y = line(y, `Paid: ${formatDate(invoice.paidAt)}`)
  }
  const svc = invoice.service?.name ?? invoice.description ?? '—'
  y = line(y, `Service / note: ${svc}`)
  doc.save(`invoice-${invoice.invoiceNumber}.pdf`)
}
