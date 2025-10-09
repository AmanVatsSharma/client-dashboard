'use client'

/**
 * InvoicesPage - Invoices & Payments dashboard page
 * 
 * Features:
 * - Summary cards for outstanding, paid, overdue, next due
 * - Search/filter invoices
 * - Tabbed view: Invoices & Payment History
 * - Pay, Download, and View invoice actions
 * - Dialog for invoice details
 * 
 * Error handling: Alerts for payment/download errors
 * Console logs for debugging
 * 
 * Flow Chart:
 * [User loads page] 
 *   -> [Summary cards]
 *   -> [Search/filter]
 *   -> [Tabs: Invoices | Payment History]
 *     -> [Invoices: Table, Actions]
 *     -> [Payment History: Table]
 *   -> [Dialog: Invoice Details]
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
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
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export default function InvoicesPage() {
  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null)

  // Mock data - replace with real API calls
  const invoices = [
    {
      id: 'INV-001',
      invoiceNumber: 'VB240915001',
      service: 'Web Development Package',
      amount: 15000,
      status: 'paid',
      dueDate: new Date('2025-09-15'),
      paidAt: new Date('2025-09-14'),
      createdAt: new Date('2025-09-01')
    },
    {
      id: 'INV-002',
      invoiceNumber: 'VB240920002',
      service: 'SEO Optimization',
      amount: 8000,
      status: 'pending',
      dueDate: new Date('2025-10-20'),
      paidAt: null,
      createdAt: new Date('2025-09-20')
    },
    {
      id: 'INV-003',
      invoiceNumber: 'VB240810003',
      service: 'Brand Identity Design',
      amount: 12000,
      status: 'paid',
      dueDate: new Date('2025-08-15'),
      paidAt: new Date('2025-08-10'),
      createdAt: new Date('2025-08-01')
    },
    {
      id: 'INV-004',
      invoiceNumber: 'VB240925004',
      service: 'Cloud Hosting',
      amount: 3500,
      status: 'overdue',
      dueDate: new Date('2025-09-25'),
      paidAt: null,
      createdAt: new Date('2025-09-10')
    },
    {
      id: 'INV-005',
      invoiceNumber: 'VB241001005',
      service: 'Mobile App Development',
      amount: 22500,
      status: 'pending',
      dueDate: new Date('2025-10-15'),
      paidAt: null,
      createdAt: new Date('2025-10-01')
    }
  ]

  const paymentHistory = [
    {
      id: 'PAY-001',
      invoiceNumber: 'VB240915001',
      amount: 15000,
      method: 'Razorpay',
      transactionId: 'pay_ABC123XYZ',
      date: new Date('2025-09-14'),
      status: 'success'
    },
    {
      id: 'PAY-002',
      invoiceNumber: 'VB240810003',
      amount: 12000,
      method: 'Bank Transfer',
      transactionId: 'TXN789DEF456',
      date: new Date('2025-08-10'),
      status: 'success'
    }
  ]

  // Filtered invoices by search
  const filteredInvoices = invoices.filter(invoice =>
    invoice.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Status icon
  const getStatusIcon = (status: string) => {
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

  // Status badge
  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'default',
      pending: 'secondary',
      overdue: 'destructive'
    }
    return variants[status as keyof typeof variants] || 'secondary'
  }

  // Payment handler
  const handlePayment = async (invoiceId: string) => {
    setPaymentLoading(invoiceId)
    console.log('Initiating payment for', invoiceId)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      const invoice = invoices.find(inv => inv.id === invoiceId)
      if (invoice) {
        invoice.status = 'paid'
        invoice.paidAt = new Date()
        console.log('Payment successful for', invoiceId)
      }
      alert('Payment successful!')
    } catch (error) {
      console.error('Payment failed', error)
      alert('Payment failed. Please try again.')
    } finally {
      setPaymentLoading(null)
    }
  }

  // Download handler
  const downloadInvoice = (invoiceNumber: string) => {
    try {
      // Simulate download
      console.log('Downloading invoice', invoiceNumber)
      alert(`Downloading invoice ${invoiceNumber}...`)
    } catch (error) {
      console.error('Download failed', error)
      alert('Download failed. Please try again.')
    }
  }

  // Invoice details dialog open
  const openInvoiceDialog = (invoice: any) => {
    setSelectedInvoice(invoice)
    console.log('Opening invoice dialog for', invoice.invoiceNumber)
  }

  // Invoice details dialog close
  const closeInvoiceDialog = () => {
    setSelectedInvoice(null)
    console.log('Closing invoice dialog')
  }

  // --- Render ---
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Invoices & Payments</h1>
          <p className="text-muted-foreground">Track your billing and payment history</p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(i => i.status !== 'paid').length} pending invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(15000)}
            </div>
            <p className="text-xs text-muted-foreground">1 payment processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(3500)}
            </div>
            <p className="text-xs text-muted-foreground">1 overdue invoice</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Due</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Oct 15</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(8000)} due</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants}>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="invoices" className="space-y-6">
          <TabsList>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
          </TabsList>

          {/* Invoices Tab */}
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
                    {filteredInvoices.map((invoice, index) => (
                      <motion.tr
                        key={invoice.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group"
                      >
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.service}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(invoice.status)}
                            <Badge variant={getStatusBadge(invoice.status) as any} className="text-xs capitalize">
                              {invoice.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(invoice.dueDate)}
                          {invoice.status === 'overdue' && (
                            <span className="ml-2 text-xs text-red-600 font-bold">Overdue</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openInvoiceDialog(invoice)}
                                >
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent onInteractOutside={closeInvoiceDialog}>
                                <DialogHeader>
                                  <DialogTitle>Invoice Details</DialogTitle>
                                  <DialogDescription>
                                    Invoice #{invoice.invoiceNumber}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2">
                                  <div>
                                    <span className="font-semibold">Service:</span> {invoice.service}
                                  </div>
                                  <div>
                                    <span className="font-semibold">Amount:</span> {formatCurrency(invoice.amount)}
                                  </div>
                                  <div>
                                    <span className="font-semibold">Status:</span> {invoice.status}
                                  </div>
                                  <div>
                                    <span className="font-semibold">Due Date:</span> {formatDate(invoice.dueDate)}
                                  </div>
                                  <div>
                                    <span className="font-semibold">Created:</span> {formatDate(invoice.createdAt)}
                                  </div>
                                  {invoice.paidAt && (
                                    <div>
                                      <span className="font-semibold">Paid At:</span> {formatDate(invoice.paidAt)}
                                    </div>
                                  )}
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      downloadInvoice(invoice.invoiceNumber)
                                    }}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                  {invoice.status !== 'paid' && (
                                    <Button
                                      onClick={() => handlePayment(invoice.id)}
                                      disabled={paymentLoading === invoice.id}
                                    >
                                      {paymentLoading === invoice.id ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Processing...
                                        </>
                                      ) : (
                                        <>
                                          <CreditCard className="h-4 w-4 mr-2" />
                                          Pay Now
                                        </>
                                      )}
                                    </Button>
                                  )}
                                  <Button variant="ghost" onClick={closeInvoiceDialog}>
                                    Close
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadInvoice(invoice.invoiceNumber)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {invoice.status !== 'paid' && (
                              <Button
                                size="sm"
                                onClick={() => handlePayment(invoice.id)}
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
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>All your past payments</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Transaction</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No payment history found.
                        </TableCell>
                      </TableRow>
                    )}
                    {paymentHistory.map((payment, idx) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.id}</TableCell>
                        <TableCell>{payment.invoiceNumber}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell>
                          <span className="text-xs font-mono">{payment.transactionId}</span>
                        </TableCell>
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
    </motion.div>
  )
}

/**
 * Module: InvoicesPage
 * 
 * - Handles invoice listing, payment, download, and details dialog.
 * - Handles payment history listing.
 * - All actions have error handling and debugging logs.
 * 
 * Please see code comments and flow chart above for details.
 */
