import NextAuth, { DefaultSession } from "next-auth"
import { Role } from "@prisma/client"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: Role
            dni: string
        } & DefaultSession["user"]
    }

    interface User {
        role: Role
        dni: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: Role
        dni: string
    }
}