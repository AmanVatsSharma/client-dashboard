/**
 * @file page.tsx
 * @module client-dashboard/dashboard/support/[ticketId]
 * @description Ticket detail: load from API, send client messages, loading/error states.
 * @author BharatERP
 * @created 2026-04-09
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import type { Priority, TicketStatus } from '@prisma/client'
import {
  ArrowLeft,
  Send,
  User,
  UserCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ticketStatusToUi, priorityToUi } from '@/lib/ticket-display'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

type ApiMessage = {
  id: string
  message: string
  isAdmin: boolean
  createdAt: string
}

type ApiTicket = {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: Priority
  createdAt: string
  updatedAt: string
  service: { id: string; name: string } | null
  messages: ApiMessage[]
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = typeof params.ticketId === 'string' ? params.ticketId : ''

  const [ticket, setTicket] = useState<ApiTicket | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ok' | 'error' | 'notfound'>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  const fetchTicket = useCallback(async () => {
    if (!ticketId) {
      setLoadState('notfound')
      return
    }
    setLoadState('loading')
    setLoadError(null)
    try {
      const res = await fetch(`/api/tickets/${ticketId}`)
      if (res.status === 404) {
        setTicket(null)
        setLoadState('notfound')
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load ticket')
      }
      const data = (await res.json()) as ApiTicket
      setTicket(data)
      setLoadState('ok')
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load')
      setLoadState('error')
    }
  }, [ticketId])

  useEffect(() => {
    void fetchTicket()
  }, [fetchTicket])

  const getStatusIcon = (uiStatus: string) => {
    switch (uiStatus) {
      case 'open':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-600" />
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'closed':
        return <CheckCircle className="h-5 w-5 text-gray-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadge = (uiStatus: string) => {
    const variants = {
      open: 'destructive',
      'in-progress': 'default',
      resolved: 'secondary',
      closed: 'outline'
    }
    return variants[uiStatus as keyof typeof variants] || 'secondary'
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      urgent: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    }
    return variants[priority as keyof typeof variants] || 'secondary'
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticketId || !ticket) return
    setSending(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send')
      }
      setNewMessage('')
      await fetchTicket()
    } catch {
      setLoadError('Could not send message. Ticket may be closed.')
    } finally {
      setSending(false)
    }
  }

  if (loadState === 'loading' && !ticket) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (loadState === 'notfound') {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/support')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to tickets
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Ticket not found</CardTitle>
            <CardDescription>This ticket does not exist or you do not have access.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/dashboard/support">View all tickets</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loadState === 'error' || !ticket) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/support')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to tickets
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>{loadError || 'Unable to load ticket.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void fetchTicket()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const uiStatus = ticketStatusToUi(ticket.status)
  const uiPriority = priorityToUi(ticket.priority)
  const canReply = ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED'

  const messagesForUi = ticket.messages.map((m) => ({
    ...m,
    createdAt: new Date(m.createdAt),
    sender: m.isAdmin ? 'Support Team' : 'You'
  }))

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/support')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tickets
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary-700">{ticket.title}</h1>
            <p className="text-muted-foreground">Ticket #{ticket.id.slice(0, 8)}…</p>
          </div>
        </div>
      </motion.div>

      {loadError && (
        <p className="text-sm text-destructive">{loadError}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-3">
                  {getStatusIcon(uiStatus)}
                  <span>{ticket.title}</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <Badge variant={getStatusBadge(uiStatus) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                    {uiStatus.replace('-', ' ')}
                  </Badge>
                  <Badge variant={getPriorityBadge(uiPriority) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                    {uiPriority} priority
                  </Badge>
                </div>
              </div>
              <CardDescription>
                Created on {formatDate(ticket.createdAt)} • Last updated {formatDate(ticket.updatedAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Service:</span>
                    <p className="text-muted-foreground">{ticket.service?.name ?? '—'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Assigned to:</span>
                    <p className="text-muted-foreground">Support team</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
              <CardDescription>All messages related to this ticket</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {messagesForUi.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: message.isAdmin ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex space-x-3 ${message.isAdmin ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback
                        className={
                          message.isAdmin ? 'bg-blue-100 text-blue-600' : 'gold-gradient text-primary-900'
                        }
                      >
                        {message.isAdmin ? <UserCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${message.isAdmin ? 'text-right' : ''}`}>
                      <div className="flex items-center space-x-2 mb-1">
                        {message.isAdmin ? (
                          <>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(message.createdAt)} at{' '}
                              {message.createdAt.toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="text-sm font-medium text-blue-600">{message.sender}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-medium">{message.sender}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(message.createdAt)} at{' '}
                              {message.createdAt.toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </>
                        )}
                      </div>
                      <div
                        className={`p-3 rounded-lg max-w-md ${
                          message.isAdmin
                            ? 'bg-blue-50 border border-blue-200 ml-auto'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {canReply ? (
                  <div className="flex items-end space-x-2 mt-6">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={2}
                      className="flex-1 resize-none"
                    />
                    <Button
                      variant="default"
                      size="icon"
                      onClick={() => void handleSendMessage()}
                      disabled={!newMessage.trim() || sending}
                      aria-label="Send message"
                    >
                      {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground pt-2">
                    This ticket is resolved or closed. Open a new ticket if you need more help.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(uiStatus)}
                <span className="capitalize">{uiStatus.replace('-', ' ')}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getPriorityBadge(uiPriority) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                {uiPriority}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Service</CardTitle>
            </CardHeader>
            <CardContent>
              <span>{ticket.service?.name ?? '—'}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Assigned To</CardTitle>
            </CardHeader>
            <CardContent>
              <span>Support team</span>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
