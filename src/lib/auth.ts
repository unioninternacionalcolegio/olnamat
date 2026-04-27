import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    // FUERZA LA LECTURA DEL SECRETO, usa un valor fallback si falla
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development",
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                dni: { label: "DNI", type: "text", placeholder: "Tu DNI" },
                password: { label: "Contraseña", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.dni || !credentials?.password) {
                    throw new Error("Credenciales incompletas")
                }

                const user = await prisma.user.findUnique({
                    where: { dni: credentials.dni }
                })

                if (!user || !user.password) {
                    throw new Error("Usuario no encontrado")
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

                if (!isPasswordValid) {
                    throw new Error("Contraseña incorrecta")
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    dni: user.dni as string,
                }
            }
        })
    ],
    session: { strategy: "jwt" },
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.dni = user.dni
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as any
                session.user.dni = token.dni as string
            }
            return session
        }
    }
}