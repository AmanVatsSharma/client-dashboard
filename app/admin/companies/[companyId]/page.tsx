'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Building2, Users, Receipt, Ticket, StickyNote, Plus, Loader2,
  Upload, CheckCircle2, XCircle, Clock, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toaster'

type CompanyUser = {
  id: string; userId: string; role: string; jobTitle?: string; isActive: boolean
  user: { id: string; name?: string; email: string; phone?: string }
}
type Service = { id: string; name: string; status: string; type: string; price: number; isVariablePrice: boolean }
type Invoice = {
  id: string; invoiceNumber: string; amount: number; status: string; dueDate: string
  service?: { name: string }
  paymentProofs: { id: string; status: string; fileName: string; uploadedAt: string }[]
}
type TicketType = { id: string; title: string; status: string; priority: string; openedBy?: { name: string }; _count: { messages: number } }
type Note = { id: string; title: string; content: string; isPrivate: boolean; createdAt: string }
type Company = {
  id: string; name: string; domain?: string; industry?: string; country?: string; phone?: string; address?: string; isActive: boolean
  users: CompanyUser[]; services: Service[]; invoices: Invoice[]; tickets: TicketType[]; notes: Note[]
}

const roleColors: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  MEMBER: 'bg-slate-100 text-slate-600',
  VIEWER: 'bg-gray-100 text-gray-500',
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

export default function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [addServiceOpen, setAddServiceOpen] = useState(false)
  const [addInvoiceOpen, setAddInvoiceOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', phone: '', role: 'MEMBER', jobTitle: '' })
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', type: 'SUBSCRIPTION', status: 'ACTIVE', price: '', isVariablePrice: false, nextBilling: '' })
  const [invoiceForm, setInvoiceForm] = useState({ amount: '', description: '', dueDate: '', status: 'PENDING', serviceId: '' })

  useEffect(() => { fetchCompany() }, [companyId])

  async function fetchCompany() {
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`)
      if (res.ok) setCompany(await res.json())
    } finally { setLoading(false) }
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/users`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userForm),
      })
      if (res.ok) {
        toast({ title: 'User added' })
        setAddUserOpen(false)
        setUserForm({ name: '', email: '', password: '', phone: '', role: 'MEMBER', jobTitle: '' })
        fetchCompany()
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error, variant: 'destructive' })
      }
    } finally { setSaving(false) }
  }

  async function addService(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/services`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...serviceForm, price: parseFloat(serviceForm.price) || 0, isVariablePrice: serviceForm.isVariablePrice }),
      })
      if (res.ok) {
        toast({ title: 'Service created' })
        setAddServiceOpen(false)
        setServiceForm({ name: '', description: '', type: 'SUBSCRIPTION', status: 'ACTIVE', price: '', isVariablePrice: false, nextBilling: '' })
        fetchCompany()
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error, variant: 'destructive' })
      }
    } finally { setSaving(false) }
  }

  async function addInvoice(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/invoices`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...invoiceForm, amount: parseFloat(invoiceForm.amount), serviceId: invoiceForm.serviceId || null }),
      })
      if (res.ok) {
        toast({ title: 'Invoice created' })
        setAddInvoiceOpen(false)
        setInvoiceForm({ amount: '', description: '', dueDate: '', status: 'PENDING', serviceId: '' })
        fetchCompany()
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error, variant: 'destructive' })
      }
    } finally { setSaving(false) }
  }

  async function toggleUserActive(userId: string, isActive: boolean) {
    await fetch(`/api/admin/companies/${companyId}/users/${userId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    fetchCompany()
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
  if (!company) return <div className="text-center py-20 text-slate-500">Company not found</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
          <Building2 className="h-6 w-6 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
          <div className="flex flex-wrap gap-2 mt-1">
            {company.domain && <span className="text-sm text-slate-500">{company.domain}</span>}
            {company.industry && <Badge variant="outline" className="text-xs">{company.industry}</Badge>}
            {company.country && <Badge variant="outline" className="text-xs">{company.country}</Badge>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList className="bg-slate-100 flex-wrap h-auto">
          <TabsTrigger value="users" className="gap-1.5"><Users className="h-3.5 w-3.5" />Users ({company.users.length})</TabsTrigger>
          <TabsTrigger value="services" className="gap-1.5"><Building2 className="h-3.5 w-3.5" />Services ({company.services.length})</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5"><Receipt className="h-3.5 w-3.5" />Invoices ({company.invoices.length})</TabsTrigger>
          <TabsTrigger value="tickets" className="gap-1.5"><Ticket className="h-3.5 w-3.5" />Tickets ({company.tickets.length})</TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5"><StickyNote className="h-3.5 w-3.5" />Notes ({company.notes.length})</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="h-4 w-4 mr-1" />Add User</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Add User to {company.name}</DialogTitle></DialogHeader>
                <form onSubmit={addUser} className="space-y-3 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Full Name *</Label><Input required value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>Job Title</Label><Input value={userForm.jobTitle} onChange={e => setUserForm(p => ({ ...p, jobTitle: e.target.value }))} placeholder="CEO" /></div>
                    <div className="col-span-2 space-y-1"><Label>Email *</Label><Input type="email" required value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>Password *</Label><Input type="password" required minLength={6} value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>Phone</Label><Input value={userForm.phone} onChange={e => setUserForm(p => ({ ...p, phone: e.target.value }))} /></div>
                    <div className="col-span-2 space-y-1">
                      <Label>Role</Label>
                      <Select value={userForm.role} onValueChange={v => setUserForm(p => ({ ...p, role: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OWNER">Owner</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="VIEWER">Viewer (read-only)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={saving}>
                    {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding...</> : 'Add User'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {company.users.map(cu => (
              <Card key={cu.id} className={!cu.isActive ? 'opacity-60' : ''}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 font-semibold text-indigo-700">
                    {cu.user.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-800">{cu.user.name || 'No name'}</p>
                      <Badge className={`text-[10px] px-2 py-0.5 ${roleColors[cu.role]}`}>{cu.role}</Badge>
                      {!cu.isActive && <Badge className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600">Deactivated</Badge>}
                    </div>
                    <p className="text-sm text-slate-500">{cu.user.email}</p>
                    {cu.jobTitle && <p className="text-xs text-slate-400">{cu.jobTitle}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/admin/messages/${cu.user.id}`}>
                      <Button size="sm" variant="outline" className="text-xs">Message</Button>
                    </Link>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => toggleUserActive(cu.user.id, cu.isActive)}>
                      {cu.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={addServiceOpen} onOpenChange={setAddServiceOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="h-4 w-4 mr-1" />Add Service</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Add Service for {company.name}</DialogTitle></DialogHeader>
                <form onSubmit={addService} className="space-y-3 mt-2">
                  <div className="space-y-1"><Label>Service Name *</Label><Input required value={serviceForm.name} onChange={e => setServiceForm(p => ({ ...p, name: e.target.value }))} placeholder="Web Development" /></div>
                  <div className="space-y-1"><Label>Description</Label><Input value={serviceForm.description} onChange={e => setServiceForm(p => ({ ...p, description: e.target.value }))} /></div>
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
                        <input type="checkbox" checked={serviceForm.isVariablePrice} onChange={e => setServiceForm(p => ({ ...p, isVariablePrice: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-sm text-slate-700">Variable pricing (amount changes each billing cycle)</span>
                      </label>
                    </div>
                    <div className="space-y-1">
                      <Label>{serviceForm.isVariablePrice ? 'Base Price (₹)' : 'Price (₹) *'}</Label>
                      <Input type="number" required={!serviceForm.isVariablePrice} min="0" step="0.01" value={serviceForm.price} onChange={e => setServiceForm(p => ({ ...p, price: e.target.value }))} placeholder={serviceForm.isVariablePrice ? '0 if unknown' : '9999'} />
                      {serviceForm.isVariablePrice && <p className="text-[11px] text-slate-400">Used as default suggestion when creating invoices</p>}
                    </div>
                    <div className="space-y-1"><Label>Next Billing</Label><Input type="date" value={serviceForm.nextBilling} onChange={e => setServiceForm(p => ({ ...p, nextBilling: e.target.value }))} /></div>
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={saving}>
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
                      {s.isVariablePrice ? (s.price > 0 ? `~₹${s.price.toLocaleString()} (variable)` : 'Variable pricing') : `₹${s.price.toLocaleString()}`}
                    </p>
                  </div>
                  <Badge className={`text-xs ${statusColors[s.status]}`}>{s.status}</Badge>
                  <Badge variant="outline" className="text-xs">{s.type.replace('_', '-')}</Badge>
                  {s.isVariablePrice && <Badge className="text-[10px] bg-amber-50 text-amber-700">Variable</Badge>}
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
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="h-4 w-4 mr-1" />Add Invoice</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Create Invoice for {company.name}</DialogTitle></DialogHeader>
                <form onSubmit={addInvoice} className="space-y-3 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label>Service (optional)</Label>
                      <Select value={invoiceForm.serviceId} onValueChange={v => {
                        const svc = company.services.find(s => s.id === v)
                        setInvoiceForm(p => ({
                          ...p,
                          serviceId: v,
                          amount: svc && svc.price > 0 ? String(svc.price) : p.amount,
                        }))
                      }}>
                        <SelectTrigger><SelectValue placeholder="No service" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No service</SelectItem>
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
                    <div className="space-y-1"><Label>Amount (₹) *</Label><Input type="number" required min="0" step="0.01" value={invoiceForm.amount} onChange={e => setInvoiceForm(p => ({ ...p, amount: e.target.value }))} placeholder="Enter amount" /></div>
                    <div className="space-y-1"><Label>Due Date *</Label><Input type="date" required value={invoiceForm.dueDate} onChange={e => setInvoiceForm(p => ({ ...p, dueDate: e.target.value }))} /></div>
                    <div className="col-span-2 space-y-1"><Label>Description</Label><Input value={invoiceForm.description} onChange={e => setInvoiceForm(p => ({ ...p, description: e.target.value }))} placeholder="Monthly retainer..." /></div>
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={saving}>
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
                          <Badge className={`text-[10px] px-1.5 py-0 ${inv.paymentProofs[0].status === 'APPROVED' ? 'bg-green-100 text-green-700' : inv.paymentProofs[0].status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {inv.paymentProofs[0].status === 'PENDING' ? 'Proof pending' : inv.paymentProofs[0].status === 'APPROVED' ? 'Proof approved' : 'Proof rejected'}
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
            <Link href={`/admin/notes?companyId=${company.id}`}>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="h-4 w-4 mr-1" />Add Note</Button>
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
