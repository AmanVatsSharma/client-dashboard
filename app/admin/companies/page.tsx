'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Building2,
  Plus,
  Search,
  Users,
  Ticket,
  Receipt,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toaster'

interface Company {
  id: string
  name: string
  domain?: string
  industry?: string
  country?: string
  isActive: boolean
  createdAt: string
  _count: { users: number; tickets: number; invoices: number }
  invoices: { amount: number; status: string }[]
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState(false)

  const [form, setForm] = useState({
    companyName: '', domain: '', industry: '', country: '', phone: '',
    ownerName: '', ownerEmail: '', ownerPassword: '', ownerPhone: '', ownerJobTitle: '',
  })

  useEffect(() => {
    fetchCompanies()
  }, [])

  async function fetchCompanies() {
    try {
      const res = await fetch('/api/admin/companies')
      if (res.ok) setCompanies(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast({ title: 'Company created', description: `${form.companyName} has been set up.` })
        setOpen(false)
        setForm({ companyName: '', domain: '', industry: '', country: '', phone: '', ownerName: '', ownerEmail: '', ownerPassword: '', ownerPhone: '', ownerJobTitle: '' })
        fetchCompanies()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } finally {
      setCreating(false)
    }
  }

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.domain?.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  )

  const outstandingAmount = (c: Company) =>
    c.invoices.filter(i => ['PENDING', 'OVERDUE'].includes(i.status)).reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
          <p className="text-sm text-slate-500 mt-1">{companies.length} client companies</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Company</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Company Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input id="companyName" required value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} placeholder="Acme Corp" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="domain">Domain</Label>
                    <Input id="domain" value={form.domain} onChange={e => setForm(p => ({ ...p, domain: e.target.value }))} placeholder="acme.com" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="industry">Industry</Label>
                    <Input id="industry" value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} placeholder="Technology" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="India" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Owner / Primary Contact</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="ownerName">Full Name *</Label>
                    <Input id="ownerName" required value={form.ownerName} onChange={e => setForm(p => ({ ...p, ownerName: e.target.value }))} placeholder="John Doe" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ownerJobTitle">Job Title</Label>
                    <Input id="ownerJobTitle" value={form.ownerJobTitle} onChange={e => setForm(p => ({ ...p, ownerJobTitle: e.target.value }))} placeholder="CEO" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label htmlFor="ownerEmail">Email *</Label>
                    <Input id="ownerEmail" type="email" required value={form.ownerEmail} onChange={e => setForm(p => ({ ...p, ownerEmail: e.target.value }))} placeholder="john@acme.com" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ownerPassword">Password *</Label>
                    <Input id="ownerPassword" type="password" required minLength={6} value={form.ownerPassword} onChange={e => setForm(p => ({ ...p, ownerPassword: e.target.value }))} placeholder="Min 6 characters" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ownerPhone">Phone</Label>
                    <Input id="ownerPhone" value={form.ownerPhone} onChange={e => setForm(p => ({ ...p, ownerPhone: e.target.value }))} placeholder="+91 ..." />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={creating}>
                {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : 'Create Company'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Search companies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Companies Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-slate-400">
            <Building2 className="h-12 w-12 mb-3" />
            <p className="text-sm">{search ? 'No companies match your search' : 'No companies yet. Create the first one!'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(company => (
            <Link key={company.id} href={`/admin/companies/${company.id}`}>
              <Card className="hover:shadow-md transition-all cursor-pointer group border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">{company.name}</p>
                        {company.domain && <p className="text-xs text-slate-500">{company.domain}</p>}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors mt-1" />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {company.industry && (
                      <Badge variant="outline" className="text-xs">{company.industry}</Badge>
                    )}
                    {company.country && (
                      <Badge variant="outline" className="text-xs">{company.country}</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
                        <Users className="h-3 w-3" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">{company._count.users}</p>
                      <p className="text-[10px] text-slate-400">Users</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
                        <Ticket className="h-3 w-3" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">{company._count.tickets}</p>
                      <p className="text-[10px] text-slate-400">Tickets</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
                        <Receipt className="h-3 w-3" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">{company._count.invoices}</p>
                      <p className="text-[10px] text-slate-400">Invoices</p>
                    </div>
                  </div>

                  {outstandingAmount(company) > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-rose-600 font-medium">
                        Outstanding: ₹{outstandingAmount(company).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
