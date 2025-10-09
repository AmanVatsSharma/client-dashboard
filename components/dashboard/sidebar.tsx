'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Package,
  Receipt,
  HelpCircle,
  Settings,
  Menu,
  LogOut
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Services', href: '/dashboard/services', icon: Package },
  { name: 'Invoices & Payments', href: '/dashboard/invoices', icon: Receipt },
  { name: 'Support Tickets', href: '/dashboard/support', icon: HelpCircle },
  { name: 'Profile & Settings', href: '/dashboard/profile', icon: Settings },
]

interface SidebarProps {
  className?: string
}

export function DashboardSidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center px-6 py-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex  justify-center space-x-4"
        >
          <Image
            src="/logo_favicon.webp"
            alt="Vedpragya Bharat"
            width={140}
            height={70}
            className="h-10 w-auto"
            priority
          />
          <span className="text-2xl font-bold text-primary-700">IT & Dev</span>
        </motion.div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-2">
          {navigation.map((item, index) => {
            const isActive = pathname === item.href
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'gold-gradient text-primary-900 shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-primary-700'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 transition-transform duration-200',
                      isActive
                        ? 'text-primary-900'
                        : 'text-gray-400 group-hover:text-primary-600',
                      'group-hover:scale-110'
                    )}
                  />
                  {item.name}
                  {isActive && (
                    <motion.div
                      className="ml-auto w-2 h-2 bg-primary-900 rounded-full"
                      layoutId="activeIndicator"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="px-3 py-6 border-t border-gray-200">
        <Button
          onClick={() => signOut()}
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r border-border shadow-xl">
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
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
