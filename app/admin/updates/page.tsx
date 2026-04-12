'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Bell, Plus, Trash2, Loader2, Globe, Building2 } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

interface Update {
  id: string; title: string; content: string; createdAt: string
  author: { name?: string }
  company?: { id: string; name: string }
  _count: { reads: number }
}
interface Company { id: string; name: string }

export default function AdminUpdatesPage() {
  const [updates, setUpdates] = useState<Update[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', companyId: 'ALL' })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/updates').then(r => r.json()),
      fetch('/api/admin/companies').then(r => r.json()),
    ]).then(([u, c]) => { setUpdates(u); setCompanies(c) }).finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/admin/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, companyId: form.companyId === 'ALL' ? null : form.companyId }),
      })
      if (res.ok) {
        toast({ title: 'Update posted' })
        setOpen(false)
        setForm({ title: '', content: '', companyId: 'ALL' })
        const res2 = await fetch('/api/admin/updates')
        setUpdates(await res2.json())
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error, variant: 'destructive' })
      }
    } finally { setSaving(false) }
  }

  async function deleteUpdate(id: string) {
    if (!confirm('Delete this update?')) return
    const res = await fetch(`/api/admin/updates/${id}`, { method: 'DELETE' })
    if (res.ok) { setUpdates(prev => prev.filter(u => u.id !== id)); toast({ title: 'Deleted' }) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Updates & Announcements</h1>
          <p className="text-sm text-slate-500 mt-1">Send updates to specific companies or broadcast to all</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="h-4 w-4 mr-2" />New Update</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Post an Update</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Send to</Label>
                <Select value={form.companyId} onValueChange={v => setForm(p => ({ ...p, companyId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">
                      <div className="flex items-center gap-2"><Globe className="h-4 w-4" />All Companies (broadcast)</div>
                    </SelectItem>
                    {companies.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2"><Building2 className="h-4 w-4" />{c.name}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Title *</Label><Input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="New feature deployed..." /></div>
              <div className="space-y-1"><Label>Content *</Label><Textarea required rows={4} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="We have deployed..." /></div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Posting...</> : 'Post Update'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : updates.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12 text-slate-400"><Bell className="h-12 w-12 mb-3" /><p className="text-sm">No updates posted yet</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {updates.map(u => (
            <Card key={u.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-slate-800">{u.title}</p>
                      {u.company ? (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Building2 className="h-3 w-3" />{u.company.name}
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-blue-100 text-blue-700 flex items-center gap-1">
                          <Globe className="h-3 w-3" />Broadcast
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{u.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>By {u.author.name || 'Admin'}</span>
                      <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                      <span>{u._count.reads} read{u._count.reads !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteUpdate(u.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
