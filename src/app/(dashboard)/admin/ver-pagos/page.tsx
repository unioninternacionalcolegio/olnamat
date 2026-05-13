// app/(dashboard)/admin/ver-pagos/page.tsx
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import ListaPagos from "./ListaPagos"

export default async function VerPagosPage() {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMINISTRADOR", "ASISTENTE"].includes(session.user.role)) {
        redirect("/delegado")
    }

    const esAdmin = session.user.role === "ADMINISTRADOR"
    const miUserId = session.user.id

    const filtroQuery: any = esAdmin
        ? {}
        : {
            OR: [
                { estado: 'PENDIENTE' },
                { cajeroId: miUserId }
            ]
        }

    const pagos = await prisma.pago.findMany({
        where: filtroQuery,
        include: {
            cliente: true,
            cajero: true,
            // AÑADIDO: Traemos los estudiantes para el reporte Excel
            estudiantes: {
                select: { dni: true, nombres: true, apellidos: true }
            },
            _count: {
                select: { estudiantes: true }
            }
        },
        orderBy: [
            { estado: 'desc' },
            { createdAt: 'desc' }
        ]
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Validación y Caja</h1>
                <p className="text-gray-600">Verifica depósitos, libera comprobantes y genera reportes.</p>
            </div>

            <ListaPagos
                iniciales={pagos}
                currentUserId={miUserId}
                role={session.user.role}
            />
        </div>
    )
}