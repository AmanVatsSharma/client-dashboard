/**
 * File:        app/admin/individuals/[userId]/page.tsx
 * Module:      Admin UI · Individual Client Detail
 * Purpose:     Detail view for a single individual client showing their services, invoices, tickets, and notes via tabs.
 *
 * Exports:
 *   - IndividualDetailPage() — 'use client' page component; renders individual header, edit dialog, and tabbed data
 *
 * Depends on:
 *   - @/components/ui/card         — Card, CardContent layout primitives
 *   - @/components/ui/button       — Button for actions
 *   - @/components/ui/input        — Input for edit form fields
 *   - @/components/ui/label        — Label for form fields
 *   - @/components/ui/badge        — Badge for statuses
 *   - @/components/ui/tabs         — Tabs, TabsContent, TabsList, TabsTrigger
 *   - @/components/ui/dialog       — Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
 *   - @/components/ui/select       — Select for type/status dropdowns
 *   - @/components/ui/toaster      — toast notifications
 *
 * Side-effects:
 *   - GET /api/admin/individuals/${userId}               — fetches individual by userId directly (single-record endpoint)
 *   - GET /api/admin/companies/${companyId}              — fetches services, invoices, tickets, notes
 *   - PATCH /api/admin/individuals/${userId}             — updates name, email, phone, isActive
 *   - POST /api/admin/companies/${companyId}/services    — creates a service for this individual's company
 *   - POST /api/admin/companies/${companyId}/invoices    — creates an invoice for this individual's company
 *
 * Key invariants:
 *   - Individual clients own a personal company (isPersonal:true); all data lives under that companyId
 *   - Two-call data loading: GET individual by ID to get companyId, then GET company data
 *   - invoiceForm.serviceId uses '' (empty string) for "no service"; Select maps '' → '__none__' for display only
 *   - serviceId sentinel '__none__' must never reach the API; POST body normalises it to null
 *   - Notes tab uses a link to /admin/notes?companyId=... (consistent with company detail page pattern)
 *   - No "Users" tab — individual clients are solo (no team members)
 *   - Purple accent (bg-purple-100 text-purple-600) for person icon; action buttons stay indigo
 *
 * Read order:
 *   1. Type definitions (Individual, Service, Invoice, etc.) — data shapes
 *   2. IndividualDetailPage                                  — component state, loading logic, event handlers
 *   3. Tab content sections                                  — Services, Invoices, Tickets, Notes
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-04-19
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  User,
  Receipt,
  Ticket,
  StickyNote,
  Plus,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toaster'

type Individual = {
  id: string
  name: string | null
  email: string
  phone: string | null
  createdAt: string
  isActive: boolean
  companyId: string | null
  companyName: string | null
}

type Service = {
  id: string
  name: string
  status: string
  type: string
  price: number
  isVariablePrice: boolean
}

type Invoice = {
  id: string
  invoiceNumber: string
  amount: number
  status: string
  dueDate: string
  service?: { name: string }
  paymentProofs: { id: string; status: string; fileName: string; uploadedAt: string }[]
}

type TicketType = {
  id: string
  title: string
  status: string
  priority: string
  openedBy?: { name: string }
  _count: { messages: number }
}

type Note = {
  id: string
  title: string
  content: string
  isPrivate: boolean
  createdAt: string
}

type CompanyData = {
  id: string
  name: string
  isActive: boolean
  services: Service[]
  invoices: Invoice[]
  tickets: TicketType[]
  notes: Note[]
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  OPEN: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-500',
  INACTIVE: 'bg-gray-100 text-gray-500',
  COMPLETED: 'bg-indigo-100 text-indigo-700',
}

export default function IndividualDetailPage() {
  const { userId } = useParams<{ userId: string }>()

  const [individual, setIndividual] = useState<Individual | null>(null)
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [addServiceOpen, setAddServiceOpen] = useState(false)
  const [addInvoiceOpen, setAddInvoiceOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    isActive: 'true',
  })

  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    type: 'SUBSCRIPTION',
    status: 'ACTIVE',
    price: '',
    isVariablePrice: false,
    nextBilling: '',
  })

  const [invoiceForm, setInvoiceForm] = useState({
    amount: '',
    description: '',
    dueDate: '',
    status: 'PENDING',
    serviceId: '',
  })

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function loadData() {
    try {
      // Load individual by ID directly
      const indRes = await fetch(`/api/admin/individuals/${userId}`)
      if (!indRes.ok) {
        if (indRes.status === 404) {
          setNotFound(true)
        } else {
          toast({ title: 'Error', description: 'Failed to load client data', variant: 'destructive' })
        }
        return
      }
      const ind = await indRes.json()
      setIndividual(ind)
      setEditForm({
        name: ind.name ?? '',
        email: ind.email,
        phone: ind.phone ?? '',
        isActive: ind.isActive ? 'true' : 'false',
      })

      // Load company data
      const compRes = await fetch(`/api/admin/companies/${ind.companyId}`)
      if (!compRes.ok) {
        toast({ title: 'Error', description: 'Failed to load client workspace data', variant: 'destructive' })
        return
      }
      setCompany(await compRes.json())
    } catch {
      toast({ title: 'Error', description: 'Network error loading client data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/individuals/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name || undefined,
          email: editForm.email || undefined,
          phone: editForm.phone !== '' ? editForm.phone : null,
          isActive: editForm.isActive === 'true',
        }),
      })
      if (res.ok) {
        toast({ title: 'Individual updated' })
        setEditOpen(false)
        await loadData()
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error, variant: 'destructive' })
      }
    } finally {
      setSaving(false)
    }
  }

  async function addService(e: React.FormEvent) {
    e.preventDefault()
    if (!individual?.companyId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/companies/${individual.companyId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...serviceForm,
          price: parseFloat(serviceForm.price) || 0,
        }),
      })
      if (res.ok) {
        toast({ title: 'Service created' })
        setAddServiceOpen(false)
        setServiceForm({ name: '', description: '', type: 'SUBSCRIPTION', status: 'ACTIVE', price: '', isVariablePrice: false, nextBilling: '' })
        await loadData()
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error, variant: 'destructive' })
      }
    } finally {
      setSaving(false)
    }
  }

  async function addInvoice(e: React.FormEvent) {
    e.preventDefault()
    if (!individual?.companyId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/companies/${individual.companyId}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...invoiceForm,
          amount: parseFloat(invoiceForm.amount),
          serviceId: invoiceForm.serviceId && invoiceForm.serviceId !== '__none__' ? invoiceForm.serviceId : null,
        }),
      })
      if (res.ok) {
        toast({ title: 'Invoice created' })
        setAddInvoiceOpen(false)
        setInvoiceForm({ amount: '', description: '', dueDate: '', status: 'PENDING', serviceId: '' })
        await loadData()
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error, variant: 'destructive' })
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (notFound || !individual || !company) {
    return <div className="text-center py-20 text-slate-500">Individual client not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
            <User className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{individual.name || 'No name'}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span className="text-sm text-slate-500">{individual.email}</span>
              {individual.phone && (
                <span className="text-sm text-slate-500">{individual.phone}</span>
              )}
              <Badge
                className={`text-xs ${individual.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {individual.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">Edit</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Individual Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-3 mt-2">
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input
                  value={editForm.name}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input
                  value={editForm.phone}
                  onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={editForm.isActive}
                  onValueChange={v => setEditForm(p => ({ ...p, isActive: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={saving}
              >
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="services">
        <TabsList className="bg-slate-100 flex-wrap h-auto">
          <TabsTrigger value="services" className="gap-1.5">
            <User className="h-3.5 w-3.5" />Services ({company.services.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5">
            <Receipt className="h-3.5 w-3.5" />Invoices ({company.invoices.length})
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-1.5">
            <Ticket className="h-3.5 w-3.5" />Tickets ({company.tickets.length})
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5">
            <StickyNote className="h-3.5 w-3.5" />Notes ({company.notes.length})
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={addServiceOpen} onOpenChange={setAddServiceOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="h-4 w-4 mr-1" />Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Service for {individual.name || individual.email}</DialogTitle>
                </DialogHeader>
                <form onSubmit={addService} className="space-y-3 mt-2">
                  <div className="space-y-1">
                    <Label>Service Name *</Label>
                    <Input
                      required
                      value={serviceForm.name}
                      onChange={e => setServiceForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Web Development"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Input
                      value={serviceForm.description}
                      onChange={e => setServiceForm(p => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Type</Label>
                      <Select value={serviceForm.type} onValueChange={v => setServiceForm(p => ({ ...p, type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                          <SelectItem value="ONE_TIME">One-time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Status</Label>
                      <Select value={serviceForm.status} onValueChange={v => setServiceForm(p => ({ ...p, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={serviceForm.isVariablePrice}
                          onChange={e => setServiceForm(p => ({ ...p, isVariablePrice: e.target.checked }))}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700">Variable pricing (amount changes each billing cycle)</span>
                      </label>
                    </div>
                    <div className="space-y-1">
                      <Label>{serviceForm.isVariablePrice ? 'Base Price (₹)' : 'Price (₹) *'}</Label>
                      <Input
                        type="number"
                        required={!serviceForm.isVariablePrice}
                        min="0"
                        step="0.01"
                        value={serviceForm.price}
                        onChange={e => setServiceForm(p => ({ ...p, price: e.target.value }))}
                        placeholder={serviceForm.isVariablePrice ? '0 if unknown' : '9999'}
                      />
                      {serviceForm.isVariablePrice && (
                        <p className="text-[11px] text-slate-400">Used as default suggestion when creating invoices</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label>Next Billing</Label>
                      <Input
                        type="date"
                        value={serviceForm.nextBilling}
                        onChange={e => setServiceForm(p => ({ ...p, nextBilling: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={saving}
                  >
                    {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : 'Create Service'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {company.services.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm">No services yet</p>
            ) : company.services.map(s => (
              <Card key={s.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{s.name}</p>
                    <p className="text-sm text-slate-500">
                      {s.isVariablePrice
                        ? (s.price > 0 ? `~₹${s.price.toLocaleString()} (variable)` : 'Variable pricing')
                        : `₹${s.price.toLocaleString()}`}
                    </p>
                  </div>
                  <Badge className={`text-xs ${statusColors[s.status]}`}>{s.status}</Badge>
                  <Badge variant="outline" className="text-xs">{s.type.replace('_', '-')}</Badge>
                  {s.isVariablePrice && (
                    <Badge className="text-[10px] bg-amber-50 text-amber-700">Variable</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={addInvoiceOpen} onOpenChange={setAddInvoiceOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="h-4 w-4 mr-1" />Add Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Invoice for {individual.name || individual.email}</DialogTitle>
                </DialogHeader>
                <form onSubmit={addInvoice} className="space-y-3 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label>Service (optional)</Label>
                      <Select
                        value={invoiceForm.serviceId || '__none__'}
                        onValueChange={v => {
                          const serviceId = v === '__none__' ? '' : v
                          const svc = company.services.find(s => s.id === serviceId)
                          setInvoiceForm(p => ({
                            ...p,
                            serviceId,
                            amount: svc && svc.price > 0 ? String(svc.price) : p.amount,
                          }))
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="No service" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No service</SelectItem>
                          {company.services.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}{s.isVariablePrice ? ' (variable)' : ` — ₹${s.price.toLocaleString()}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {invoiceForm.serviceId && company.services.find(s => s.id === invoiceForm.serviceId)?.isVariablePrice && (
                        <p className="text-[11px] text-amber-600">This service has variable pricing — enter this month&apos;s amount below</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label>Amount (₹) *</Label>
                      <Input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={invoiceForm.amount}
                        onChange={e => setInvoiceForm(p => ({ ...p, amount: e.target.value }))}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Due Date *</Label>
                      <Input
                        type="date"
                        required
                        value={invoiceForm.dueDate}
                        onChange={e => setInvoiceForm(p => ({ ...p, dueDate: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label>Description</Label>
                      <Input
                        value={invoiceForm.description}
                        onChange={e => setInvoiceForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="Monthly retainer..."
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={saving}
                  >
                    {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : 'Create Invoice'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {company.invoices.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm">No invoices yet</p>
            ) : company.invoices.map(inv => (
              <Link key={inv.id} href={`/admin/invoices/${inv.id}`}>
                <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800">{inv.invoiceNumber}</p>
                        {inv.paymentProofs.length > 0 && (
                          <Badge className={`text-[10px] px-1.5 py-0 ${
                            inv.paymentProofs[0].status === 'APPROVED'
                              ? 'bg-green-100 text-green-700'
                              : inv.paymentProofs[0].status === 'REJECTED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {inv.paymentProofs[0].status === 'PENDING'
                              ? 'Proof pending'
                              : inv.paymentProofs[0].status === 'APPROVED'
                              ? 'Proof approved'
                              : 'Proof rejected'}
                          </Badge>
                        )}
                      </div>
                      {inv.service && <p className="text-xs text-slate-500">{inv.service.name}</p>}
                      <p className="text-xs text-slate-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-slate-800">₹{inv.amount.toLocaleString()}</p>
                      <Badge className={`text-xs ${statusColors[inv.status]}`}>{inv.status}</Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4 mt-4">
          <div className="space-y-3">
            {company.tickets.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm">No tickets yet</p>
            ) : company.tickets.map(t => (
              <Link key={t.id} href={`/admin/tickets/${t.id}`}>
                <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{t.title}</p>
                      {t.openedBy && <p className="text-xs text-slate-500">Opened by {t.openedBy.name}</p>}
                      <p className="text-xs text-slate-400">{t._count.messages} message{t._count.messages !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge className={`text-xs ${statusColors[t.status]}`}>{t.status.replace('_', ' ')}</Badge>
                      <Badge variant="outline" className="text-xs">{t.priority}</Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Link href={`/admin/notes?companyId=${individual.companyId}`}>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="h-4 w-4 mr-1" />Add Note
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {company.notes.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm">No notes yet</p>
            ) : company.notes.map(n => (
              <Card key={n.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-slate-800">{n.title}</p>
                    <Badge variant={n.isPrivate ? 'outline' : 'secondary'} className="text-xs">
                      {n.isPrivate ? 'Private' : 'Shared with client'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{n.content}</p>
                  <p className="text-xs text-slate-400 mt-2">{new Date(n.createdAt).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
