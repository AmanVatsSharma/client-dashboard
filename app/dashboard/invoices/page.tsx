/**
 * @file page.tsx
 * @module client-dashboard/dashboard/invoices
 * @description Invoices and payment history. Includes proof-of-payment upload for pending/overdue invoices.
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  Search,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Upload,
  FileCheck,
  XCircle,
  Hourglass,
  Link as LinkIcon
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { invoiceStatusToUi, type UiInvoiceStatus } from '@/lib/invoice-display'
import { toast } from '@/components/ui/toaster'
import { downloadInvoicePdf } from '@/lib/invoice-pdf'
import Link from 'next/link'

interface PaymentProofInfo {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  adminNotes?: string | null
  uploadedAt: string
}

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
  paymentProofs?: PaymentProofInfo[]
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

function ProofStatusBadge({ proofs }: { proofs?: PaymentProofInfo[] }) {
  if (!proofs || proofs.length === 0) return null
  const latest = proofs[proofs.length - 1]
  if (latest.status === 'PENDING') {
    return (
      <Badge className="text-[10px] bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-0.5 w-fit">
        <Hourglass className="h-2.5 w-2.5" />Proof under review
      </Badge>
    )
  }
  if (latest.status === 'APPROVED') {
    return (
      <Badge className="text-[10px] bg-green-100 text-green-800 border-green-200 flex items-center gap-0.5 w-fit">
        <FileCheck className="h-2.5 w-2.5" />Proof approved
      </Badge>
    )
  }
  return (
    <div className="space-y-0.5">
      <Badge className="text-[10px] bg-red-100 text-red-800 border-red-200 flex items-center gap-0.5 w-fit">
        <XCircle className="h-2.5 w-2.5" />Proof rejected
      </Badge>
      {latest.adminNotes && (
        <p className="text-[10px] text-red-600 max-w-[200px]">{latest.adminNotes}</p>
      )}
    </div>
  )
}

function serviceLabel(inv: InvoiceRow): string {
  return inv.service?.name ?? inv.description ?? 'General'
}

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

function UploadProofDialog({
  invoice,
  open,
  onClose,
  onUploaded
}: {
  invoice: InvoiceRow
  open: boolean
  onClose: () => void
  onUploaded: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Please upload a JPEG, PNG, WEBP, or PDF.' })
      return
    }
    if (f.size > MAX_FILE_BYTES) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Maximum file size is 5 MB.' })
      return
    }
    setFile(f)
  }

  async function upload() {
    if (!file) return
    setUploading(true)
    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const res = await fetch(`/api/invoices/${invoice.id}/payment-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileData: base64,
          fileType: file.type,
          fileSize: file.size
        })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      toast({ title: 'Proof uploaded', description: 'Our team will verify and update your invoice shortly.' })
      onUploaded()
      onClose()
    } catch (e) {
      toast({ variant: 'destructive', title: 'Upload failed', description: e instanceof Error ? e.message : 'Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  function handleClose() {
    if (!uploading) {
      setFile(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Payment Proof</DialogTitle>
          <DialogDescription>
            Invoice {invoice.invoiceNumber} · {formatCurrency(invoice.amount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              const f = e.dataTransfer.files[0]
              if (f) handleFile(f)
            }}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
            {file ? (
              <div>
                <p className="text-sm font-medium text-slate-700">{file.name}</p>
                <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-600">Click or drag & drop to upload</p>
                <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WEBP or PDF · max 5 MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 space-y-1">
            <p className="font-semibold">Before uploading:</p>
            <p>1. Transfer the exact amount to one of our <Link href="/dashboard/payments" className="underline font-medium">bank accounts</Link></p>
            <p>2. Include invoice number {invoice.invoiceNumber} in payment reference</p>
            <p>3. Upload a screenshot or PDF of the transaction receipt here</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={uploading}>Cancel</Button>
          <Button onClick={upload} disabled={!file || uploading}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload Proof
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null)
  const [uploadTarget, setUploadTarget] = useState<InvoiceRow | null>(null)

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

  function canUploadProof(inv: InvoiceRow): boolean {
    const ui = invoiceStatusToUi(inv.status)
    if (ui === 'paid' || ui === 'cancelled') return false
    const proofs = inv.paymentProofs ?? []
    const hasPending = proofs.some(p => p.status === 'PENDING')
    return !hasPending
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
          <h1 className="text-2xl font-bold text-slate-900">Invoices & Payments</h1>
          <p className="text-muted-foreground">Track your billing and payment history</p>
        </div>
        <Link href="/dashboard/payments">
          <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Bank Details
          </Button>
        </Link>
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
                    <CardDescription>
                      Manage your invoices · upload proof of payment after bank transfer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Mobile card view */}
                    <div className="block sm:hidden space-y-3">
                      {filteredInvoices.length === 0 && (
                        <p className="text-center text-muted-foreground py-6 text-sm">No invoices found.</p>
                      )}
                      {filteredInvoices.map(invoice => {
                        const ui = invoiceStatusToUi(invoice.status)
                        return (
                          <Card key={invoice.id}>
                            <CardContent className="p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(ui)}
                                  <Badge variant={getStatusBadge(ui)} className="text-xs capitalize">{ui}</Badge>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500">{serviceLabel(invoice)}</p>
                              <p className="text-lg font-bold">{formatCurrency(invoice.amount)}</p>
                              <p className="text-xs text-slate-400">Due {formatDate(invoice.dueDate)}</p>
                              <ProofStatusBadge proofs={invoice.paymentProofs} />
                              <div className="flex gap-2 pt-1">
                                <Button size="sm" variant="outline" onClick={() => void downloadInvoice(invoice.id)}>
                                  <Download className="h-3.5 w-3.5 mr-1" />PDF
                                </Button>
                                {canUploadProof(invoice) && (
                                  <Button size="sm" onClick={() => setUploadTarget(invoice)}>
                                    <Upload className="h-3.5 w-3.5 mr-1" />Upload Proof
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>

                    {/* Desktop table view */}
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Proof</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredInvoices.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                                  <ProofStatusBadge proofs={invoice.paymentProofs} />
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
                                    {canUploadProof(invoice) && (
                                      <Button
                                        size="sm"
                                        onClick={() => setUploadTarget(invoice)}
                                      >
                                        <Upload className="h-4 w-4 mr-1" />
                                        Proof
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
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

      {/* Invoice detail dialog */}
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
              {selectedInvoice.paymentProofs && selectedInvoice.paymentProofs.length > 0 && (
                <div className="pt-2">
                  <span className="font-semibold block mb-1">Payment Proof:</span>
                  <ProofStatusBadge proofs={selectedInvoice.paymentProofs} />
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => void downloadInvoice(selectedInvoice.id)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              {canUploadProof(selectedInvoice) && (
                <Button
                  onClick={() => {
                    setSelectedInvoice(null)
                    setUploadTarget(selectedInvoice)
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Proof
                </Button>
              )}
              <Button variant="ghost" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Upload proof dialog */}
      {uploadTarget && (
        <UploadProofDialog
          invoice={uploadTarget}
          open={!!uploadTarget}
          onClose={() => setUploadTarget(null)}
          onUploaded={() => void load()}
        />
      )}
    </motion.div>
  )
}
