/**
 * @file page.tsx
 * @module client-dashboard/dashboard/profile
 * @description Profile server shell + client settings form (session + Prisma-backed user).
 * @author BharatERP
 * @created 2026-04-09
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ProfileSettingsForm } from '@/components/dashboard/profile-settings-form'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  const user = session?.user

  const dbUser = user?.id
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true, email: true, company: true, phone: true }
      })
    : null

  const name = dbUser?.name ?? user?.name ?? ''
  const company = dbUser?.company ?? user?.company ?? ''
  const phone = dbUser?.phone ?? ''

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-primary-700">Profile & Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account details and password.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="gold-gradient text-primary-900 text-xl font-bold">
                {name?.charAt(0) ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{name || 'User'}</CardTitle>
              <CardDescription>{dbUser?.email ?? user?.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Company</span>
          <Badge variant="secondary">{company?.trim() ? company : 'Not set'}</Badge>
        </CardContent>
      </Card>

      <ProfileSettingsForm initialName={name} initialCompany={company ?? ''} initialPhone={phone ?? ''} />
    </div>
  )
}
