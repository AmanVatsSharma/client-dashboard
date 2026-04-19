/**
 * File:        components/admin/sidebar.tsx
 * Module:      Admin · Layout · Sidebar
 * Purpose:     Responsive sidebar navigation for the admin panel, rendering a fixed
 *              desktop sidebar and a Sheet-based mobile drawer with all primary nav links.
 *
 * Exports:
 *   - AdminSidebar() — sidebar component; renders desktop fixed sidebar + mobile Sheet trigger
 *
 * Depends on:
 *   - @/lib/utils      — cn() class merging
 *   - @/components/ui/button        — Button
 *   - @/components/ui/scroll-area   — ScrollArea
 *   - @/components/ui/sheet         — Sheet, SheetContent, SheetTrigger (mobile drawer)
 *
 * Side-effects:
 *   - Calls next-auth signOut on logout button click
 *
 * Key invariants:
 *   - Active route detection uses startsWith so nested routes stay highlighted.
 *   - SidebarContent is defined as an inner component to share across desktop/mobile renders.
 *
 * Read order:
 *   1. navigation — route definitions
 *   2. AdminSidebar — component with SidebarContent inner component
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-04-19
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Building2,
  Receipt,
  Ticket,
  Landmark,
  Bell,
  StickyNote,
  MessageSquare,
  Menu,
  LogOut,
  ShieldCheck,
  User,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Companies', href: '/admin/companies', icon: Building2 },
  { name: 'Individual Clients', href: '/admin/individuals', icon: User },
  { name: 'Invoices', href: '/admin/invoices', icon: Receipt },
  { name: 'Tickets', href: '/admin/tickets', icon: Ticket },
  { name: 'Bank Accounts', href: '/admin/bank-accounts', icon: Landmark },
  { name: 'Updates', href: '/admin/updates', icon: Bell },
  { name: 'Notes', href: '/admin/notes', icon: StickyNote },
  { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
]

export function AdminSidebar() {
  const pathname = usePathname()

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-indigo-800">
        <div className="p-2 bg-indigo-500 rounded-lg">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">Admin Panel</p>
          <p className="text-xs text-indigo-300 mt-0.5">Support Team</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 group',
                  isActive
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-4 w-4 flex-shrink-0',
                    isActive ? 'text-white' : 'text-indigo-400 group-hover:text-white'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-indigo-800">
        <Button
          onClick={() => signOut({ callbackUrl: '/login' })}
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
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto bg-indigo-900">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden fixed top-4 left-4 z-40 bg-indigo-900 text-white hover:bg-indigo-800"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 bg-indigo-900 border-indigo-800">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
