import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      company?: string
      phone?: string
    }
  }

  interface User {
    id: string
    email: string
    name: string | null
    company: string | null
    phone?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    company?: string
    name?: string
    phone?: string
  }
}
