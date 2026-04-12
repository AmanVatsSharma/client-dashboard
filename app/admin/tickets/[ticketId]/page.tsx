'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Send, ShieldCheck, User } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toaster'

interface Message {
  id: string; message: string; isAdmin: boolean; createdAt: string
  author?: { id: string; name?: string; role: string; companyUsers: { jobTitle?: string; role: string }[] }
}
interface Ticket {
  id: string; title: string; description: string; status: string; priority: string; createdAt: string
  company: { id: string; name: string }
  openedBy?: { name?: string; email: string }
  service?: { name: string }
  messages: Message[]
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-500',
}

export default function AdminTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [newPriority, setNewPriority] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/admin/tickets/${ticketId}`)
      .then(r => r.json())
      .then(data => { setTicket(data); setNewStatus(data.status); setNewPriority(data.priority) })
      .finally(() => setLoading(false))
  }, [ticketId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [ticket?.messages])

  async function sendReply() {
    if (!reply.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim() }),
      })
      if (res.ok) {
        const newMsg = await res.json()
        setTicket(prev => prev ? { ...prev, messages: [...prev.messages, newMsg], status: prev.status === 'OPEN' ? 'IN_PROGRESS' : prev.status } : null)
        setReply('')
        if (newStatus === 'OPEN') setNewStatus('IN_PROGRESS')
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error, variant: 'destructive' })
      }
    } finally { setSending(false) }
  }

  async function updateTicket() {
    const res = await fetch(`/api/admin/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, priority: newPriority }),
    })
    if (res.ok) {
      toast({ title: 'Ticket updated' })
      setTicket(prev => prev ? { ...prev, status: newStatus, priority: newPriority } : null)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
  if (!ticket) return <div className="text-center py-20 text-slate-500">Ticket not found</div>

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/tickets"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900">{ticket.title}</h1>
          <Link href={`/admin/companies/${ticket.company.id}`} className="text-sm text-indigo-600 hover:underline">{ticket.company.name}</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Thread */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-700">{ticket.openedBy?.name || 'Client'}</p>
                    <span className="text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <div className="space-y-3">
            {ticket.messages.map(msg => {
              const isAdmin = msg.isAdmin
              const authorName = msg.author?.name || (isAdmin ? 'Support Team' : 'Client')
              const jobTitle = msg.author?.companyUsers?.[0]?.jobTitle
              return (
                <div key={msg.id} className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isAdmin ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                    {isAdmin ? <ShieldCheck className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-slate-500" />}
                  </div>
                  <div className={`flex-1 max-w-[85%] ${isAdmin ? 'items-end' : ''}`}>
                    <div className={`flex items-center gap-2 mb-1 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                      <p className="text-xs font-medium text-slate-600">{authorName}</p>
                      {jobTitle && <p className="text-xs text-slate-400">{jobTitle}</p>}
                      <span className="text-xs text-slate-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={`rounded-xl px-4 py-2.5 text-sm ${isAdmin ? 'bg-indigo-600 text-white ml-auto' : 'bg-slate-100 text-slate-700'}`}>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Reply Box */}
          {!['RESOLVED', 'CLOSED'].includes(ticket.status) && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <Textarea
                  placeholder="Type your reply..."
                  rows={3}
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply() }}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Ctrl+Enter to send</span>
                  <Button onClick={sendReply} disabled={sending || !reply.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Ticket Info</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <Badge className={statusColors[ticket.status]}>{ticket.status.replace('_', ' ')}</Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Priority</p>
                <Badge variant="outline">{ticket.priority}</Badge>
              </div>
              {ticket.service && <div><p className="text-xs text-slate-500 mb-1">Service</p><p className="text-slate-700">{ticket.service.name}</p></div>}
              <div><p className="text-xs text-slate-500 mb-1">Created</p><p className="text-slate-700">{new Date(ticket.createdAt).toLocaleDateString()}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Update Ticket</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-slate-500">Status</p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500">Priority</p>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={updateTicket}
                disabled={newStatus === ticket.status && newPriority === ticket.priority}
              >
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
