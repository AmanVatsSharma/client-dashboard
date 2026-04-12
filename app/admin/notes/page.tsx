'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { StickyNote, Plus, Pencil, Trash2, Loader2, Lock, Eye } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

interface Note {
  id: string; title: string; content: string; isPrivate: boolean; createdAt: string; updatedAt: string
  author: { name?: string }
  company?: { id: string; name: string }
}
interface Company { id: string; name: string }

export default function AdminNotesPage() {
  const searchParams = useSearchParams()
  const prefilledCompanyId = searchParams.get('companyId') || ''

  const [notes, setNotes] = useState<Note[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Note | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', companyId: prefilledCompanyId, isPrivate: true })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/notes').then(r => r.json()),
      fetch('/api/admin/companies').then(r => r.json()),
    ]).then(([n, c]) => { setNotes(n); setCompanies(c) }).finally(() => setLoading(false))
  }, [])

  function openCreate() { setEditing(null); setForm({ title: '', content: '', companyId: prefilledCompanyId, isPrivate: true }); setOpen(true) }
  function openEdit(n: Note) {
    setEditing(n)
    setForm({ title: n.title, content: n.content, companyId: n.company?.id || '', isPrivate: n.isPrivate })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const url = editing ? `/api/admin/notes/${editing.id}` : '/api/admin/notes'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, companyId: form.companyId || null }),
      })
      if (res.ok) {
        toast({ title: editing ? 'Note updated' : 'Note created' })
        setOpen(false)
        const res2 = await fetch('/api/admin/notes')
        setNotes(await res2.json())
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error, variant: 'destructive' })
      }
    } finally { setSaving(false) }
  }

  async function deleteNote(id: string) {
    if (!confirm('Delete this note?')) return
    const res = await fetch(`/api/admin/notes/${id}`, { method: 'DELETE' })
    if (res.ok) { setNotes(prev => prev.filter(n => n.id !== id)); toast({ title: 'Deleted' }) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notes</h1>
          <p className="text-sm text-slate-500 mt-1">Internal notes and decisions, optionally shared with clients</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="h-4 w-4 mr-2" />New Note</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Edit Note' : 'Create Note'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1"><Label>Title *</Label><Input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Q1 roadmap discussion..." /></div>
              <div className="space-y-1"><Label>Content *</Label><Textarea required rows={5} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Key decisions made..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Link to Company</Label>
                  <Select value={form.companyId} onValueChange={v => setForm(p => ({ ...p, companyId: v }))}>
                    <SelectTrigger><SelectValue placeholder="General" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">General (no company)</SelectItem>
                      {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Visibility</Label>
                  <Select value={form.isPrivate ? 'private' : 'shared'} onValueChange={v => setForm(p => ({ ...p, isPrivate: v === 'private' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private (admin only)</SelectItem>
                      <SelectItem value="shared">Shared with client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : (editing ? 'Update Note' : 'Create Note')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : notes.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12 text-slate-400"><StickyNote className="h-12 w-12 mb-3" /><p className="text-sm">No notes yet</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map(n => (
            <Card key={n.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-slate-800 flex-1">{n.title}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    {n.isPrivate ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 flex items-center gap-0.5"><Lock className="h-2.5 w-2.5" />Private</Badge>
                    ) : (
                      <Badge className="text-[10px] px-1.5 bg-blue-100 text-blue-700 flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />Client visible</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-600 line-clamp-3 mb-3">{n.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {n.company && <Badge variant="outline" className="text-[10px]">{n.company.name}</Badge>}
                    <span className="text-xs text-slate-400">{new Date(n.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600" onClick={() => openEdit(n)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600" onClick={() => deleteNote(n.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
