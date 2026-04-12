import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      phone?: string
      role: string
      companyId: string | null
      companyName: string | null
      companyRole: string | null
      jobTitle: string | null
    }
  }

  interface User {
    id: string
    email: string
    name: string | null
    phone?: string | null
    role: string
    companyId?: string | null
    companyName?: string | null
    companyRole?: string | null
    jobTitle?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    name?: string
    phone?: string
    role?: string
    companyId?: string
    companyName?: string
    companyRole?: string
    jobTitle?: string
  }
}
