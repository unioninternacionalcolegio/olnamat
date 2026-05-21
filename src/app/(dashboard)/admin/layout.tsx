import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) redirect("/login")

    // Buscamos al usuario en la BD para saber su rol real
    const dbUser = await prisma.user.findFirst({
        where: session.user.email ? { email: session.user.email } : { name: session.user.name }
    })

    if (!dbUser) redirect("/login")

    // Roles permitidos para entrar a TODO /admin/...
    const rolesPermitidos = ["ADMINISTRADOR", "ASISTENTE", "REVISADOR"]

    if (!rolesPermitidos.includes(dbUser.role)) {
        // Si un delegado o libre intenta entrar por URL, lo regresamos a su zona
        if (["DELEGADO", "REPRESENTANTE_IE", "LIBRE"].includes(dbUser.role)) {
            redirect("/delegado")
        }
        redirect("/login")
    }

    // Si todo está bien, le mostramos la página que pidió
    return <>{children}</>
}