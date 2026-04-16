'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, Loader2, ShieldCheck, User } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

interface Message {
  id: string; message: string; fromUserId: string; isRead: boolean; createdAt: string
  from: { id: string; name?: string; role: string }
  to: { id: string; name?: string; role: string }
}

interface Admin { id: string; name?: string; email: string }

export default function MessagesPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [selectedAdminId, setSelectedAdminId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch admins list (who to message)
    fetch('/api/admin-list').then(r => r.ok ? r.json() : []).then((a: Admin[]) => {
      setAdmins(a)
      if (a.length > 0) setSelectedAdminId(a[0].id)
    })
    fetch('/api/messages').then(r => r.json()).then(setMessages).finally(() => setLoading(false))
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendMessage() {
    if (!text.trim() || !selectedAdminId) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), toUserId: selectedAdminId }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => [...prev, msg])
        setText('')
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error, variant: 'destructive' })
      }
    } finally { setSending(false) }
  }

  const myId = session?.user?.id

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Direct Messages</h1>
        <p className="text-sm text-slate-500 mt-1">Private messages with the support team</p>
      </div>

      {/* Admin selector if multiple admins */}
      {admins.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {admins.map(a => (
            <Button
              key={a.id}
              size="sm"
              variant={selectedAdminId === a.id ? 'default' : 'outline'}
              onClick={() => setSelectedAdminId(a.id)}
              className={selectedAdminId === a.id ? 'bg-primary-600 text-white' : ''}
            >
              {a.name || a.email}
            </Button>
          ))}
        </div>
      )}

      {/* Message thread */}
      <Card className="min-h-[400px] flex flex-col">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            Support Team
            <Badge variant="outline" className="text-xs">Private</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[450px]">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary-600" /></div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-slate-400">
              <MessageSquare className="h-8 w-8 mb-2" />
              <p className="text-sm">No messages yet. Say hello to the support team!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isFromMe = msg.fromUserId === myId
              return (
                <div key={msg.id} className={`flex gap-2 ${isFromMe ? 'flex-row-reverse' : ''}`}>
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${isFromMe ? 'bg-primary-600' : 'bg-indigo-600'}`}>
                    {isFromMe ? <User className="h-3.5 w-3.5 text-white" /> : <ShieldCheck className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <div className={`max-w-[80%]`}>
                    <p className={`text-xs text-slate-400 mb-1 ${isFromMe ? 'text-right' : ''}`}>
                      {isFromMe ? 'You' : (msg.from.name || 'Support')} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className={`rounded-xl px-3 py-2 text-sm ${isFromMe ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </CardContent>
      </Card>

      {/* Input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Type a message to the support team..."
          rows={2}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendMessage() }}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Ctrl+Enter to send</span>
          <Button onClick={sendMessage} disabled={sending || !text.trim() || !selectedAdminId}>
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Send Message
          </Button>
        </div>
      </div>
    </div>
  )
}
