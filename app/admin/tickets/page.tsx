'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Search, Ticket, MessageSquare, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface TicketItem {
  id: string; title: string; description: string
  status: string; priority: string; createdAt: string
  company: { id: string; name: string }
  openedBy?: { id: string; name?: string }
  service?: { name: string }
  _count: { messages: number }
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-500',
}
const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-slate-100 text-slate-600',
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')

  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (priorityFilter !== 'ALL') params.set('priority', priorityFilter)
    setLoading(true)
    fetch(`/api/admin/tickets?${params}`)
      .then(r => r.json())
      .then(setTickets)
      .finally(() => setLoading(false))
  }, [statusFilter, priorityFilter])

  const filtered = tickets.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.company.name.toLowerCase().includes(search.toLowerCase()) ||
    t.openedBy?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
        <p className="text-sm text-slate-500 mt-1">{tickets.filter(t => ['OPEN', 'IN_PROGRESS'].includes(t.status)).length} open tickets</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input className="pl-9" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priorities</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12 text-slate-400"><Ticket className="h-12 w-12 mb-3" /><p className="text-sm">No tickets found</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <Link key={t.id} href={`/admin/tickets/${t.id}`}>
              <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-800">{t.title}</p>
                    </div>
                    <p className="text-sm text-indigo-600 font-medium mt-0.5">{t.company.name}</p>
                    {t.openedBy?.name && <p className="text-xs text-slate-500">Opened by {t.openedBy.name}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />{t._count.messages}
                      </span>
                      <span className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge className={`text-xs ${statusColors[t.status]}`}>{t.status.replace('_', ' ')}</Badge>
                    <Badge className={`text-xs ${priorityColors[t.priority]}`}>{t.priority}</Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 mt-1" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
