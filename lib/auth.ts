import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "./db"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            companyUsers: {
              where: { isActive: true },
              include: { company: { select: { id: true, name: true, isActive: true } } },
              take: 1
            }
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        const companyUser = user.companyUsers[0] ?? null

        return {
          id: user.id,
          email: user.email,
          name: user.name || '',
          phone: user.phone || '',
          role: user.role,
          companyId: companyUser?.companyId ?? null,
          companyName: companyUser?.company?.name ?? null,
          companyRole: companyUser?.role ?? null,
          jobTitle: companyUser?.jobTitle ?? null,
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
        token.phone = user.phone || undefined
        token.companyId = user.companyId ?? undefined
        token.companyName = user.companyName ?? undefined
        token.companyRole = user.companyRole ?? undefined
        token.jobTitle = user.jobTitle ?? undefined
      }
      if (trigger === 'update' && session) {
        const s = session as {
          name?: string
          phone?: string | null
          companyId?: string | null
          companyName?: string | null
          companyRole?: string | null
          jobTitle?: string | null
        }
        if (s.name !== undefined) token.name = s.name
        if (s.phone !== undefined) token.phone = s.phone ?? undefined
        if (s.companyId !== undefined) token.companyId = s.companyId ?? undefined
        if (s.companyName !== undefined) token.companyName = s.companyName ?? undefined
        if (s.companyRole !== undefined) token.companyRole = s.companyRole ?? undefined
        if (s.jobTitle !== undefined) token.jobTitle = s.jobTitle ?? undefined
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.name = (token.name as string) || session.user.name || ''
        session.user.phone = (token.phone as string) || ''
        session.user.role = (token.role as string) || 'CLIENT'
        session.user.companyId = (token.companyId as string) || null
        session.user.companyName = (token.companyName as string) || null
        session.user.companyRole = (token.companyRole as string) || null
        session.user.jobTitle = (token.jobTitle as string) || null
      }
      return session
    }
  }
}
