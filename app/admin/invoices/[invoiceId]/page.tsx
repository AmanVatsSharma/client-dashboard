'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Receipt, Building2, CheckCircle2, XCircle, Clock, Download, Loader2, ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toaster'

interface Proof {
  id: string; fileName: string; fileType: string; fileData: string
  status: string; adminNotes?: string; uploadedAt: string; reviewedAt?: string
  uploadedBy: { name?: string; email: string }
}
interface Invoice {
  id: string; invoiceNumber: string; amount: number; status: string; dueDate: string; description?: string
  company: { id: string; name: string }
  service?: { name: string }
  paymentProofs: Proof[]
}

const statusColors: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export default function AdminInvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminNotes, setAdminNotes] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    fetch(`/api/admin/invoices/${invoiceId}`)
      .then(r => r.json())
      .then(data => { setInvoice(data); setNewStatus(data.status) })
      .finally(() => setLoading(false))
  }, [invoiceId])

  async function reviewProof(proofId: string, status: 'APPROVED' | 'REJECTED') {
    setReviewing(true)
    try {
      const res = await fetch(`/api/admin/payment-proofs/${proofId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      })
      if (res.ok) {
        toast({ title: status === 'APPROVED' ? 'Proof approved — invoice marked PAID' : 'Proof rejected' })
        const r2 = await fetch(`/api/admin/invoices/${invoiceId}`)
        setInvoice(await r2.json())
        setAdminNotes('')
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error, variant: 'destructive' })
      }
    } finally { setReviewing(false) }
  }

  async function updateInvoiceStatus() {
    const res = await fetch(`/api/admin/invoices/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      toast({ title: 'Invoice updated' })
      setInvoice(await res.json())
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
  if (!invoice) return <div className="text-center py-20 text-slate-500">Invoice not found</div>

  const proof = invoice.paymentProofs[0]

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/invoices"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
        <h1 className="text-xl font-bold text-slate-900">{invoice.invoiceNumber}</h1>
        <Badge className={`${statusColors[invoice.status]}`}>{invoice.status}</Badge>
      </div>

      {/* Invoice Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2"><Receipt className="h-4 w-4" />Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div><p className="text-slate-500 text-xs">Company</p>
            <Link href={`/admin/companies/${invoice.company.id}`} className="font-medium text-indigo-600 hover:underline flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />{invoice.company.name}
            </Link>
          </div>
          <div><p className="text-slate-500 text-xs">Amount</p><p className="font-bold text-lg text-slate-800">₹{invoice.amount.toLocaleString()}</p></div>
          <div><p className="text-slate-500 text-xs">Due Date</p><p className="font-medium text-slate-700">{new Date(invoice.dueDate).toLocaleDateString()}</p></div>
          {invoice.service && <div><p className="text-slate-500 text-xs">Service</p><p className="font-medium text-slate-700">{invoice.service.name}</p></div>}
          {invoice.description && <div className="col-span-2"><p className="text-slate-500 text-xs">Description</p><p className="text-slate-700">{invoice.description}</p></div>}
        </CardContent>
      </Card>

      {/* Status Update */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-slate-600">Update Status</CardTitle></CardHeader>
        <CardContent className="flex gap-3 items-end">
          <div className="flex-1">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={updateInvoiceStatus} className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={newStatus === invoice.status}>
            Update
          </Button>
        </CardContent>
      </Card>

      {/* Payment Proof */}
      {proof ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
              Payment Proof
              <Badge className={`ml-2 ${proof.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : proof.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {proof.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-slate-600">
              <p>Uploaded by <span className="font-medium">{proof.uploadedBy.name || proof.uploadedBy.email}</span></p>
              <p className="text-xs text-slate-400 mt-0.5">{new Date(proof.uploadedAt).toLocaleString()}</p>
            </div>

            {/* Preview */}
            {proof.fileType.startsWith('image/') ? (
              <div className="border rounded-lg overflow-hidden max-h-80">
                <img
                  src={`data:${proof.fileType};base64,${proof.fileData}`}
                  alt="Payment proof"
                  className="w-full object-contain max-h-80"
                />
              </div>
            ) : (
              <a
                href={`data:${proof.fileType};base64,${proof.fileData}`}
                download={proof.fileName}
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-slate-50 text-sm text-indigo-600"
              >
                <Download className="h-4 w-4" />
                Download {proof.fileName}
              </a>
            )}

            {proof.status === 'PENDING' && (
              <div className="space-y-3 pt-3 border-t">
                <div className="space-y-1">
                  <Label>Admin Notes (optional)</Label>
                  <Textarea
                    placeholder="Add notes for the client if rejecting..."
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => reviewProof(proof.id, 'APPROVED')}
                    disabled={reviewing}
                  >
                    {reviewing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Approve & Mark Paid
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => reviewProof(proof.id, 'REJECTED')}
                    disabled={reviewing}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {proof.status !== 'PENDING' && proof.adminNotes && (
              <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                <p className="text-xs font-medium text-slate-400 mb-1">Admin Notes</p>
                <p>{proof.adminNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-8 text-slate-400">
            <Clock className="h-8 w-8 mb-2" />
            <p className="text-sm">No payment proof uploaded yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
