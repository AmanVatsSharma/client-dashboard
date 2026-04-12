'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2, Send, ShieldCheck, User } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toaster'

interface Message {
  id: string; message: string; fromUserId: string; isRead: boolean; createdAt: string
  from: { id: string; name?: string; role: string }
  to: { id: string; name?: string; role: string }
}

export default function AdminMessageThreadPage() {
  const { userId } = useParams<{ userId: string }>()
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [otherUser, setOtherUser] = useState<{ name?: string; email?: string } | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/admin/messages/${userId}`)
      .then(r => r.json())
      .then(msgs => {
        setMessages(msgs)
        if (msgs.length > 0) {
          const last = msgs[0]
          const other = last.fromUserId === userId ? last.from : last.to
          setOtherUser(other)
        }
      })
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendMessage() {
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/messages/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
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

  const adminId = session?.user?.id

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/messages"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{otherUser?.name || 'User'}</h1>
          {otherUser?.email && <p className="text-xs text-slate-500">{otherUser.email}</p>}
        </div>
      </div>

      <Card className="min-h-[400px] flex flex-col">
        <CardContent className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[500px]">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-slate-400"><p className="text-sm">No messages yet. Start the conversation!</p></div>
          ) : (
            messages.map(msg => {
              const isFromAdmin = msg.fromUserId === adminId
              return (
                <div key={msg.id} className={`flex gap-2 ${isFromAdmin ? 'flex-row-reverse' : ''}`}>
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${isFromAdmin ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                    {isFromAdmin ? <ShieldCheck className="h-3.5 w-3.5 text-white" /> : <User className="h-3.5 w-3.5 text-slate-500" />}
                  </div>
                  <div className={`max-w-[80%] ${isFromAdmin ? 'items-end' : ''}`}>
                    <p className={`text-xs text-slate-400 mb-1 ${isFromAdmin ? 'text-right' : ''}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className={`rounded-xl px-3 py-2 text-sm ${isFromAdmin ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
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

      <div className="space-y-2">
        <Textarea
          placeholder="Type a message..."
          rows={2}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendMessage() }}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Ctrl+Enter to send</span>
          <Button onClick={sendMessage} disabled={sending || !text.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
