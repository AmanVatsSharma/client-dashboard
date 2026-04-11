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
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || '',
          company: user.company || '',
          phone: user.phone || ''
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
        token.company = user.company || undefined
        token.name = user.name || undefined
        token.phone = user.phone || undefined
      }
      if (trigger === 'update' && session) {
        const s = session as {
          name?: string
          company?: string | null
          phone?: string | null
        }
        if (s.name !== undefined) token.name = s.name
        if (s.company !== undefined) token.company = s.company ?? undefined
        if (s.phone !== undefined) token.phone = s.phone ?? undefined
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.company = (token.company as string) || ''
        session.user.name = (token.name as string) || session.user.name || ''
        session.user.phone = (token.phone as string) || ''
      }
      return session
    }
  }
}
