/**
 * @file page.tsx
 * @module client-dashboard/dashboard/invoices
 * @description Invoices and payment history from /api/invoices; demo payment updates local state only.
 * @author BharatERP
 * @created 2026-04-09
 */

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { InvoiceStatus } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Receipt,
  Download,
  CreditCard,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { invoiceStatusToUi, type UiInvoiceStatus } from '@/lib/invoice-display'
import { toast } from '@/components/ui/toaster'
import { downloadInvoicePdf } from '@/lib/invoice-pdf'

type InvoiceRow = {
  id: string
  invoiceNumber: string
  amount: number
  status: InvoiceStatus
  dueDate: string
  paidAt: string | null
  createdAt: string
  description: string | null
  service: { name: string; type: string } | null
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

function getStatusIcon(status: UiInvoiceStatus) {
  switch (status) {
    case 'paid':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-600" />
    case 'overdue':
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    default:
      return <Clock className="h-4 w-4 text-gray-600" />
  }
}

function getStatusBadge(status: UiInvoiceStatus) {
  const variants: Record<UiInvoiceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    paid: 'default',
    pending: 'secondary',
    overdue: 'destructive',
    cancelled: 'outline'
  }
  return variants[status] || 'secondary'
}

function serviceLabel(inv: InvoiceRow): string {
  return inv.service?.name ?? inv.description ?? 'General'
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null)
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/invoices')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load invoices')
      }
      const data = (await res.json()) as InvoiceRow[]
      setInvoices(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const paymentHistory = useMemo(() => {
    return invoices
      .filter((i) => i.paidAt)
      .map((i, idx) => ({
        id: `pay-${i.id}`,
        invoiceNumber: i.invoiceNumber,
        amount: i.amount,
        method: 'Recorded',
        transactionId: `—${idx}`,
        date: new Date(i.paidAt as string),
        status: 'success' as const
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [invoices])

  const paidThisMonth = useMemo(() => {
    return invoices
      .filter((i) => i.paidAt && new Date(i.paidAt) >= startOfMonth)
      .reduce((s, i) => s + i.amount, 0)
  }, [invoices, startOfMonth])

  const paidThisMonthCount = useMemo(() => {
    return invoices.filter((i) => i.paidAt && new Date(i.paidAt) >= startOfMonth).length
  }, [invoices, startOfMonth])

  const outstandingTotal = useMemo(() => {
    return invoices
      .filter((i) => invoiceStatusToUi(i.status) !== 'paid' && invoiceStatusToUi(i.status) !== 'cancelled')
      .reduce((s, i) => s + i.amount, 0)
  }, [invoices])

  const outstandingCount = useMemo(() => {
    return invoices.filter(
      (i) => invoiceStatusToUi(i.status) !== 'paid' && invoiceStatusToUi(i.status) !== 'cancelled'
    ).length
  }, [invoices])

  const overdueAmount = useMemo(() => {
    return invoices
      .filter((i) => invoiceStatusToUi(i.status) === 'overdue')
      .reduce((s, i) => s + i.amount, 0)
  }, [invoices])

  const overdueCount = useMemo(() => {
    return invoices.filter((i) => invoiceStatusToUi(i.status) === 'overdue').length
  }, [invoices])

  const nextDue = useMemo(() => {
    const open = invoices
      .filter((i) => invoiceStatusToUi(i.status) === 'pending' || invoiceStatusToUi(i.status) === 'overdue')
      .map((i) => ({ ...i, due: new Date(i.dueDate) }))
      .sort((a, b) => a.due.getTime() - b.due.getTime())
    return open[0] ?? null
  }, [invoices])

  const filteredInvoices = invoices.filter(
    (invoice) =>
      serviceLabel(invoice).toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handlePayment = async (invoiceId: string) => {
    setPaymentLoading(invoiceId)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Could not record payment')
      }
      await load()
      toast({
        title: 'Payment recorded',
        description: 'Invoice marked as paid.'
      })
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Payment failed',
        description: e instanceof Error ? e.message : 'Please try again.'
      })
    } finally {
      setPaymentLoading(null)
    }
  }

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Could not load invoice')
      }
      const inv = (await res.json()) as InvoiceRow
      await downloadInvoicePdf({
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        status: invoiceStatusToUi(inv.status),
        dueDate: inv.dueDate,
        createdAt: inv.createdAt,
        paidAt: inv.paidAt,
        service: inv.service,
        description: inv.description
      })
      toast({ title: 'PDF ready', description: `Saved invoice ${inv.invoiceNumber}.` })
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: e instanceof Error ? e.message : 'Please try again.'
      })
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Invoices & Payments</h1>
          <p className="text-muted-foreground">Track your billing and payment history</p>
        </div>
      </motion.div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(outstandingTotal)}</div>
                <p className="text-xs text-muted-foreground">{outstandingCount} pending invoices</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(paidThisMonth)}</div>
                <p className="text-xs text-muted-foreground">
                  {paidThisMonthCount} payment{paidThisMonthCount !== 1 ? 's' : ''} recorded
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount)}</div>
                <p className="text-xs text-muted-foreground">
                  {overdueCount} overdue invoice{overdueCount !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Due</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {nextDue ? (
                  <>
                    <div className="text-2xl font-bold">{formatDate(nextDue.dueDate)}</div>
                    <p className="text-xs text-muted-foreground">{formatCurrency(nextDue.amount)} due</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No upcoming dues</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Tabs defaultValue="invoices" className="space-y-6">
              <TabsList>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="payments">Payment History</TabsTrigger>
              </TabsList>

              <TabsContent value="invoices">
                <Card>
                  <CardHeader>
                    <CardTitle>All Invoices</CardTitle>
                    <CardDescription>Manage your invoices and payments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvoices.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              No invoices found.
                            </TableCell>
                          </TableRow>
                        )}
                        {filteredInvoices.map((invoice) => {
                          const ui = invoiceStatusToUi(invoice.status)
                          return (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                              <TableCell>{serviceLabel(invoice)}</TableCell>
                              <TableCell className="font-bold">{formatCurrency(invoice.amount)}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(ui)}
                                  <Badge variant={getStatusBadge(ui)} className="text-xs capitalize">
                                    {ui}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatDate(invoice.dueDate)}
                                {ui === 'overdue' && (
                                  <span className="ml-2 text-xs text-red-600 font-bold">Overdue</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline" onClick={() => setSelectedInvoice(invoice)}>
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void downloadInvoice(invoice.id)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  {ui !== 'paid' && ui !== 'cancelled' && (
                                    <Button
                                      size="sm"
                                      onClick={() => void handlePayment(invoice.id)}
                                      disabled={paymentLoading === invoice.id}
                                    >
                                      {paymentLoading === invoice.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <CreditCard className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>Payments recorded on paid invoices</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference</TableHead>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentHistory.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              No payment history yet.
                            </TableCell>
                          </TableRow>
                        )}
                        {paymentHistory.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                            <TableCell>{payment.invoiceNumber}</TableCell>
                            <TableCell className="font-bold">{formatCurrency(payment.amount)}</TableCell>
                            <TableCell>{payment.method}</TableCell>
                            <TableCell>{formatDate(payment.date)}</TableCell>
                            <TableCell>
                              <Badge variant={payment.status === 'success' ? 'default' : 'destructive'}>
                                {payment.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </>
      )}

      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        {selectedInvoice && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
              <DialogDescription>Invoice #{selectedInvoice.invoiceNumber}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Service:</span> {serviceLabel(selectedInvoice)}
              </div>
              <div>
                <span className="font-semibold">Amount:</span> {formatCurrency(selectedInvoice.amount)}
              </div>
              <div>
                <span className="font-semibold">Status:</span> {invoiceStatusToUi(selectedInvoice.status)}
              </div>
              <div>
                <span className="font-semibold">Due Date:</span> {formatDate(selectedInvoice.dueDate)}
              </div>
              <div>
                <span className="font-semibold">Created:</span> {formatDate(selectedInvoice.createdAt)}
              </div>
              {selectedInvoice.paidAt && (
                <div>
                  <span className="font-semibold">Paid At:</span> {formatDate(selectedInvoice.paidAt)}
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => void downloadInvoice(selectedInvoice.id)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              {invoiceStatusToUi(selectedInvoice.status) !== 'paid' &&
                invoiceStatusToUi(selectedInvoice.status) !== 'cancelled' && (
                  <Button
                    onClick={() => void handlePayment(selectedInvoice.id)}
                    disabled={paymentLoading === selectedInvoice.id}
                  >
                    {paymentLoading === selectedInvoice.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Pay Now
                  </Button>
                )}
              <Button variant="ghost" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </motion.div>
  )
}
