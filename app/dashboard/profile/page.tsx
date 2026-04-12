/**
 * @file page.tsx
 * @module client-dashboard/dashboard/profile
 * @description Profile page — shows user details and company info from session.
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ProfileSettingsForm } from '@/components/dashboard/profile-settings-form'
import { Building2 } from 'lucide-react'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  const user = session?.user

  const dbUser = user?.id
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true, email: true, phone: true }
      })
    : null

  const name = dbUser?.name ?? user?.name ?? ''
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
        {user?.companyName && (
          <CardContent className="flex flex-wrap gap-2 items-center">
            <Building2 className="h-4 w-4 text-primary-600" />
            <span className="text-sm text-muted-foreground">Company</span>
            <Badge variant="secondary">{user.companyName}</Badge>
            {user.companyRole && (
              <Badge variant="outline" className="capitalize">{user.companyRole.toLowerCase()}</Badge>
            )}
            {user.jobTitle && (
              <Badge variant="outline">{user.jobTitle}</Badge>
            )}
          </CardContent>
        )}
      </Card>

      <ProfileSettingsForm initialName={name} initialPhone={phone ?? ''} />
    </div>
  )
}
