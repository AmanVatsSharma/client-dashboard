/**
 * File:        app/admin/individuals/page.tsx
 * Module:      Admin UI · Individual Clients List
 * Purpose:     Display all individual clients, allow search by name/email, and create new individual clients via dialog.
 *
 * Exports:
 *   - AdminIndividualsPage() — 'use client' page component; renders heading, search bar, add dialog, and cards grid
 *
 * Depends on:
 *   - @/components/ui/card         — Card, CardContent layout primitives
 *   - @/components/ui/button       — Button for actions
 *   - @/components/ui/input        — Input for search and form fields
 *   - @/components/ui/label        — Label for form fields
 *   - @/components/ui/badge        — Badge for isActive status
 *   - @/components/ui/dialog       — Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
 *   - @/components/ui/toaster      — toast notifications
 *
 * Side-effects:
 *   - GET /api/admin/individuals    — fetches all individual clients on mount
 *   - POST /api/admin/individuals   — creates a new individual client on form submit
 *
 * Key invariants:
 *   - Individual clients are users linked to isPersonal companies; API returns flat shape
 *   - Purple accent (bg-purple-100 text-purple-600) used for person icon; buttons stay indigo
 *   - Search filters client-side by name and email only (no re-fetch)
 *
 * Read order:
 *   1. Individual interface       — data shape from the API
 *   2. AdminIndividualsPage       — component state and event handlers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-04-19
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
import { User, UserPlus, Search, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toaster'

interface Individual {
  id: string
  name: string | null
  email: string
  phone: string | null
  createdAt: string
  isActive: boolean
  companyId: string | null
  companyName: string | null
}

export default function AdminIndividualsPage() {
  const [individuals, setIndividuals] = useState<Individual[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  })

  useEffect(() => {
    fetchIndividuals()
  }, [])

  async function fetchIndividuals() {
    try {
      const res = await fetch('/api/admin/individuals')
      if (res.ok) {
        setIndividuals(await res.json())
      } else {
        toast({ title: 'Error', description: 'Failed to load individual clients', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/admin/individuals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast({ title: 'Individual created', description: `${form.name} has been added.` })
        setOpen(false)
        setForm({ name: '', email: '', password: '', phone: '' })
        fetchIndividuals()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } finally {
      setCreating(false)
    }
  }

  const filtered = individuals.filter(ind =>
    (ind.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    ind.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Individual Clients</h1>
          <p className="text-sm text-slate-500 mt-1">{individuals.length} individual client{individuals.length !== 1 ? 's' : ''}</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Individual
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Individual Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="jane@example.com"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Min 6 characters"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={creating}
              >
                {creating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
                ) : (
                  'Create Individual'
                )}
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
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Individuals Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-slate-400">
            <User className="h-12 w-12 mb-3" />
            <p className="text-sm">
              {search ? 'No individuals match your search' : 'No individual clients yet. Add the first one!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(ind => (
            <Link key={ind.id} href={`/admin/individuals/${ind.id}`}>
              <Card className="hover:shadow-md transition-all cursor-pointer group border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors truncate">
                          {ind.name || 'No name'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{ind.email}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors mt-1 shrink-0" />
                  </div>

                  {ind.phone && (
                    <p className="text-xs text-slate-500 mb-3">{ind.phone}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      Joined {new Date(ind.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <Badge
                      className={`text-[10px] px-2 py-0.5 ${ind.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {ind.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
