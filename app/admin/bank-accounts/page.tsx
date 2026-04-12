'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Landmark, Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

interface BankAccount {
  id: string; name: string; bankName: string; accountHolder: string
  accountNumber: string; iban?: string; swiftCode?: string; routingNumber?: string
  country: string; currency: string; currencySymbol: string
  isActive: boolean; sortOrder: number
}

const COUNTRY_FLAGS: Record<string, string> = {
  India: '🇮🇳', USA: '🇺🇸', 'United States': '🇺🇸', UK: '🇬🇧', 'United Kingdom': '🇬🇧',
  UAE: '🇦🇪', 'United Arab Emirates': '🇦🇪', Canada: '🇨🇦', Australia: '🇦🇺',
  Germany: '🇩🇪', France: '🇫🇷', Singapore: '🇸🇬', Netherlands: '🇳🇱', Japan: '🇯🇵',
  China: '🇨🇳', 'Hong Kong': '🇭🇰', Switzerland: '🇨🇭',
}

const emptyForm = {
  name: '', bankName: '', accountHolder: '', accountNumber: '',
  iban: '', swiftCode: '', routingNumber: '',
  country: '', currency: '', currencySymbol: '', isActive: true, sortOrder: 0,
}

export default function AdminBankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BankAccount | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [showNumbers, setShowNumbers] = useState<Record<string, boolean>>({})

  useEffect(() => { fetchAccounts() }, [])

  async function fetchAccounts() {
    try {
      const res = await fetch('/api/admin/bank-accounts')
      if (res.ok) setAccounts(await res.json())
    } finally { setLoading(false) }
  }

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setOpen(true) }
  function openEdit(a: BankAccount) {
    setEditing(a)
    setForm({ name: a.name, bankName: a.bankName, accountHolder: a.accountHolder, accountNumber: a.accountNumber, iban: a.iban || '', swiftCode: a.swiftCode || '', routingNumber: a.routingNumber || '', country: a.country, currency: a.currency, currencySymbol: a.currencySymbol, isActive: a.isActive, sortOrder: a.sortOrder })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const url = editing ? `/api/admin/bank-accounts/${editing.id}` : '/api/admin/bank-accounts'
      const method = editing ? 'PATCH' : 'POST'
      const body = { ...form, sortOrder: Number(form.sortOrder) }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        toast({ title: editing ? 'Account updated' : 'Account created' })
        setOpen(false); fetchAccounts()
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error, variant: 'destructive' })
      }
    } finally { setSaving(false) }
  }

  async function deleteAccount(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    const res = await fetch(`/api/admin/bank-accounts/${id}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: 'Account deleted' }); fetchAccounts() }
  }

  async function toggleActive(a: BankAccount) {
    await fetch(`/api/admin/bank-accounts/${a.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !a.isActive }),
    })
    fetchAccounts()
  }

  // Group by country
  const grouped = accounts.reduce<Record<string, BankAccount[]>>((acc, a) => {
    if (!acc[a.country]) acc[a.country] = []
    acc[a.country].push(a)
    return acc
  }, {})

  const maskNumber = (n: string) => '•••• ' + n.slice(-4)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bank Accounts</h1>
          <p className="text-sm text-slate-500 mt-1">{accounts.filter(a => a.isActive).length} active accounts shown to clients</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4 mr-2" />Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? 'Edit Bank Account' : 'Add Bank Account'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1"><Label>Account Nickname *</Label><Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Primary USD Account" /></div>
                <div className="space-y-1"><Label>Bank Name *</Label><Input required value={form.bankName} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))} placeholder="HDFC Bank" /></div>
                <div className="space-y-1"><Label>Account Holder *</Label><Input required value={form.accountHolder} onChange={e => setForm(p => ({ ...p, accountHolder: e.target.value }))} placeholder="Vedpragya Bharat Pvt Ltd" /></div>
                <div className="col-span-2 space-y-1"><Label>Account Number *</Label><Input required value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value }))} placeholder="1234567890123456" /></div>
                <div className="space-y-1"><Label>IBAN</Label><Input value={form.iban} onChange={e => setForm(p => ({ ...p, iban: e.target.value }))} placeholder="IN60 0000 ..." /></div>
                <div className="space-y-1"><Label>SWIFT / BIC</Label><Input value={form.swiftCode} onChange={e => setForm(p => ({ ...p, swiftCode: e.target.value }))} placeholder="HDFCINBB" /></div>
                <div className="space-y-1"><Label>Routing / IFSC</Label><Input value={form.routingNumber} onChange={e => setForm(p => ({ ...p, routingNumber: e.target.value }))} placeholder="HDFC0001234" /></div>
                <div className="space-y-1"><Label>Country *</Label><Input required value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="India" /></div>
                <div className="space-y-1"><Label>Currency Code *</Label><Input required value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} placeholder="INR" /></div>
                <div className="space-y-1"><Label>Symbol *</Label><Input required value={form.currencySymbol} onChange={e => setForm(p => ({ ...p, currencySymbol: e.target.value }))} placeholder="₹" /></div>
                <div className="space-y-1"><Label>Sort Order</Label><Input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} /></div>
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : (editing ? 'Update Account' : 'Create Account')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : accounts.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12 text-slate-400"><Landmark className="h-12 w-12 mb-3" /><p className="text-sm">No bank accounts yet. Add your first one!</p></CardContent></Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([country, accts]) => (
            <div key={country}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="text-xl">{COUNTRY_FLAGS[country] || '🏦'}</span>
                {country}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accts.map(a => (
                  <Card key={a.id} className={`${!a.isActive ? 'opacity-60' : ''} border-2 ${a.isActive ? 'border-slate-200' : 'border-dashed border-slate-300'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-800">{a.name}</p>
                          <p className="text-sm text-slate-500">{a.bankName}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge className={`text-xs ${a.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {a.isActive ? 'Active' : 'Hidden'}
                          </Badge>
                          <Badge variant="outline" className="text-xs font-mono">{a.currency}</Badge>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Account</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs">
                              {showNumbers[a.id] ? a.accountNumber : maskNumber(a.accountNumber)}
                            </span>
                            <button onClick={() => setShowNumbers(p => ({ ...p, [a.id]: !p[a.id] }))} className="text-slate-400 hover:text-slate-600">
                              {showNumbers[a.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                        {a.routingNumber && <div className="flex justify-between"><span className="text-xs text-slate-400">IFSC/Routing</span><span className="font-mono text-xs">{a.routingNumber}</span></div>}
                        {a.iban && <div className="flex justify-between"><span className="text-xs text-slate-400">IBAN</span><span className="font-mono text-xs truncate max-w-32">{a.iban}</span></div>}
                        {a.swiftCode && <div className="flex justify-between"><span className="text-xs text-slate-400">SWIFT</span><span className="font-mono text-xs">{a.swiftCode}</span></div>}
                      </div>

                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openEdit(a)}>
                          <Pencil className="h-3 w-3 mr-1" />Edit
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => toggleActive(a)}>
                          {a.isActive ? 'Hide' : 'Show'}
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 hover:bg-red-50 ml-auto" onClick={() => deleteAccount(a.id, a.name)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
