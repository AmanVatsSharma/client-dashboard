'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Package,
  Receipt,
  HelpCircle,
  Settings,
  Menu,
  LogOut,
  CreditCard,
  Bell,
  FileText,
  MessageSquare,
  Building2
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Services', href: '/dashboard/services', icon: Package },
  { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
  { name: 'Payments & Bank', href: '/dashboard/payments', icon: CreditCard },
  { name: 'Support Tickets', href: '/dashboard/support', icon: HelpCircle },
  { name: 'Updates', href: '/dashboard/updates', icon: Bell, badgeKey: 'updates' },
  { name: 'Shared Notes', href: '/dashboard/notes', icon: FileText },
  { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare, badgeKey: 'messages' },
  { name: 'Profile & Settings', href: '/dashboard/profile', icon: Settings },
]

interface SidebarProps {
  className?: string
}

export function DashboardSidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [unreadCounts, setUnreadCounts] = useState<{ updates: number; messages: number }>({
    updates: 0,
    messages: 0
  })

  useEffect(() => {
    async function loadCounts() {
      try {
        const [updatesRes, messagesRes] = await Promise.all([
          fetch('/api/updates'),
          fetch('/api/messages')
        ])
        if (updatesRes.ok) {
          const updates = await updatesRes.json()
          setUnreadCounts(prev => ({
            ...prev,
            updates: Array.isArray(updates) ? updates.filter((u: { isRead: boolean }) => !u.isRead).length : 0
          }))
        }
        if (messagesRes.ok) {
          const messages = await messagesRes.json()
          const userId = session?.user?.id
          setUnreadCounts(prev => ({
            ...prev,
            messages: Array.isArray(messages)
              ? messages.filter((m: { isRead: boolean; fromUserId: string }) => !m.isRead && m.fromUserId !== userId).length
              : 0
          }))
        }
      } catch {
        // counts are non-critical — ignore errors
      }
    }
    loadCounts()
  }, [session?.user?.id])

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center px-6 py-6 border-b border-indigo-800">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center space-x-4"
        >
          <Image
            src="/logo_favicon.webp"
            alt="Vedpragya Bharat"
            width={140}
            height={70}
            className="h-10 w-auto"
            priority
          />
          <span className="text-2xl font-bold text-white">IT & Dev</span>
        </motion.div>
      </div>

      {/* Company context */}
      {session?.user?.companyName && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-lg bg-indigo-800/50 border border-indigo-700 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-indigo-300 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{session.user.companyName}</p>
            {session.user.companyRole && (
              <p className="text-[10px] text-indigo-300 capitalize">{session.user.companyRole.toLowerCase()}</p>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1">
          {navigation.map((item, index) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const badgeCount = item.badgeKey ? unreadCounts[item.badgeKey as keyof typeof unreadCounts] : 0
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-4 w-4 transition-transform duration-200',
                      isActive
                        ? 'text-white'
                        : 'text-indigo-400 group-hover:text-white',
                      'group-hover:scale-110'
                    )}
                  />
                  <span className="flex-1">{item.name}</span>
                  {badgeCount > 0 && !isActive && (
                    <Badge className="ml-auto h-5 min-w-5 px-1.5 text-[10px] bg-white text-indigo-900">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </Badge>
                  )}
                  {isActive && (
                    <motion.div
                      className="ml-auto w-2 h-2 bg-white rounded-full"
                      layoutId="activeIndicator"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User info + Logout */}
      <div className="px-3 py-4 border-t border-indigo-800">
        {session?.user?.name && (
          <p className="px-3 mb-2 text-xs text-indigo-300 truncate">{session.user.name}</p>
        )}
        <Button
          onClick={() => signOut()}
          variant="ghost"
          className="w-full justify-start text-indigo-300 hover:text-white hover:bg-indigo-700"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-indigo-900">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden fixed top-4 left-4 z-40"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 bg-indigo-900 border-indigo-800">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
