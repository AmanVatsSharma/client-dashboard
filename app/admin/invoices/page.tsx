'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Search, Receipt, Upload, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  status: string
  dueDate: string
  company: { id: string; name: string }
  service?: { name: string }
  paymentProofs: { id: string; status: string; fileName: string }[]
}

const statusColors: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [proofFilter, setProofFilter] = useState('ALL')

  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (proofFilter === 'PENDING_PROOF') params.set('hasProof', 'true')
    setLoading(true)
    fetch(`/api/admin/invoices?${params}`)
      .then(r => r.json())
      .then(data => setInvoices(data))
      .finally(() => setLoading(false))
  }, [statusFilter, proofFilter])

  const filtered = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    inv.company.name.toLowerCase().includes(search.toLowerCase()) ||
    inv.service?.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        <p className="text-sm text-slate-500 mt-1">All client invoices</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input className="pl-9" placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={proofFilter} onValueChange={setProofFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Proof" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Invoices</SelectItem>
            <SelectItem value="PENDING_PROOF">Pending Proof Review</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12 text-slate-400"><Receipt className="h-12 w-12 mb-3" /><p className="text-sm">No invoices found</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(inv => (
            <Link key={inv.id} href={`/admin/invoices/${inv.id}`}>
              <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-800">{inv.invoiceNumber}</p>
                      <span className="text-slate-400">·</span>
                      <p className="text-sm text-slate-600">{inv.company.name}</p>
                      {inv.paymentProofs.length > 0 && (
                        <Badge className={`text-[10px] px-1.5 py-0 flex items-center gap-1 ${
                          inv.paymentProofs[0].status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          inv.paymentProofs[0].status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          <Upload className="h-2.5 w-2.5" />
                          Proof {inv.paymentProofs[0].status.toLowerCase()}
                        </Badge>
                      )}
                    </div>
                    {inv.service && <p className="text-xs text-slate-500 mt-0.5">{inv.service.name}</p>}
                    <p className="text-xs text-slate-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-slate-800">₹{inv.amount.toLocaleString()}</p>
                    <Badge className={`text-xs mt-1 ${statusColors[inv.status]}`}>{inv.status}</Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
