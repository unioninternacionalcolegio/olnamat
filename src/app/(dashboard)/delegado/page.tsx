import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import DelegadoClient from "./DelegadoClient" // Importamos el nuevo componente cliente

export default async function PanelDelegado() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) redirect("/login")

    // 1. Buscamos al usuario completo
    const usuarioActual = await prisma.user.findFirst({
        where: session.user.email
            ? { email: session.user.email }
            : { name: session.user.name }
    })

    // 2. Traemos los alumnos del delegado con sus pagos
    const estudiantes = await prisma.estudiante.findMany({
        where: { creadorId: usuarioActual?.id },
        include: { pago: true },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <DelegadoClient
            estudiantes={estudiantes}
            usuario={usuarioActual}
            sessionName={session.user.name || "Delegado"}
        />
    )
}