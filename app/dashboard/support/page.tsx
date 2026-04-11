/**
 * @file page.tsx
 * @module client-dashboard/dashboard/support
 * @description Support ticket list, create dialog, links to ticket detail.
 * @author BharatERP
 * @created 2026-04-09
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Priority, TicketStatus } from '@prisma/client'
import { Plus, HelpCircle, Loader2, AlertCircle } from 'lucide-react'
import { formatDate, getRelativeTime, truncateText } from '@/lib/utils'
import { ticketStatusToUi } from '@/lib/ticket-display'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

type TicketRow = {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: Priority
  createdAt: string
  updatedAt: string
  service: { id: string; name: string } | null
}

type ServiceRow = { id: string; name: string }

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

function statusBadgeVariant(ui: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (ui === 'open') return 'destructive'
  if (ui === 'in-progress') return 'default'
  if (ui === 'resolved') return 'secondary'
  return 'outline'
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [services, setServices] = useState<ServiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPriority, setFormPriority] = useState<Priority>('MEDIUM')
  const [formServiceId, setFormServiceId] = useState<string>('')

  const loadTickets = useCallback(async () => {
    const res = await fetch('/api/tickets')
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Failed to load tickets')
    }
    return res.json() as Promise<TicketRow[]>
  }, [])

  const loadServices = useCallback(async () => {
    const res = await fetch('/api/services')
    if (!res.ok) return []
    const data = await res.json()
    return (data as { id: string; name: string }[]).map((s) => ({ id: s.id, name: s.name }))
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [tList, sList] = await Promise.all([loadTickets(), loadServices()])
      setTickets(tList)
      setServices(sList)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [loadTickets, loadServices])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function handleCreateTicket() {
    const title = formTitle.trim()
    const description = formDescription.trim()
    if (!title || !description) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          priority: formPriority,
          serviceId: formServiceId || null
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create ticket')
      }
      setFormTitle('')
      setFormDescription('')
      setFormPriority('MEDIUM')
      setFormServiceId('')
      setDialogOpen(false)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Support Tickets</h1>
          <p className="text-muted-foreground">Open a ticket or follow up on existing requests</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gold-gradient text-primary-900">
              <Plus className="mr-2 h-4 w-4" />
              New ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create support ticket</DialogTitle>
              <DialogDescription>Describe the issue. Our team will respond in the thread.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="ticket-title">Title</Label>
                <Input
                  id="ticket-title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Short summary"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ticket-desc">Description</Label>
                <Textarea
                  id="ticket-desc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="What do you need help with?"
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={formPriority} onValueChange={(v) => setFormPriority(v as Priority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {services.length > 0 && (
                <div className="grid gap-2">
                  <Label>Related service (optional)</Label>
                  <Select value={formServiceId || '__none__'} onValueChange={(v) => setFormServiceId(v === '__none__' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleCreateTicket()}
                disabled={submitting || !formTitle.trim() || !formDescription.trim()}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Your tickets
            </CardTitle>
            <CardDescription>Click a ticket to view the conversation</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : tickets.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No tickets yet. Create one to get help.</p>
            ) : (
              <ul className="space-y-3">
                {tickets.map((t, index) => {
                  const uiStatus = ticketStatusToUi(t.status)
                  return (
                    <motion.li
                      key={t.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <Link
                        href={`/dashboard/support/${t.id}`}
                        className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-medium text-primary-800">{t.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {truncateText(t.description, 120)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Updated {getRelativeTime(t.updatedAt)} · {formatDate(t.updatedAt)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 items-center">
                            <Badge variant={statusBadgeVariant(uiStatus)} className="capitalize">
                              {uiStatus.replace('-', ' ')}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {t.priority.toLowerCase()}
                            </Badge>
                            {t.service && (
                              <span className="text-xs text-muted-foreground">{t.service.name}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
