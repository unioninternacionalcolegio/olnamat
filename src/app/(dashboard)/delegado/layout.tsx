import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"

export default async function DelegadoLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) redirect("/login")

    const dbUser = await prisma.user.findFirst({
        where: session.user.email ? { email: session.user.email } : { name: session.user.name }
    })

    if (!dbUser) redirect("/login")

    // Roles permitidos para entrar a /delegado/... (Incluimos LIBRE según tu sidebar y ADMIN por si acaso)
    const rolesPermitidos = ["DELEGADO", "REPRESENTANTE_IE", "LIBRE", "ADMINISTRADOR"]

    if (!rolesPermitidos.includes(dbUser.role)) {
        // Si un asistente intenta fisgonear la vista de delegados
        if (["ASISTENTE", "REVISADOR"].includes(dbUser.role)) {
            redirect("/admin")
        }
        redirect("/login")
    }

    return <>{children}</>
}