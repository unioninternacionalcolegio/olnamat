import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import ListaPagos from "./ListaPagos"

export default async function VerPagosPage() {
    const session = await getServerSession(authOptions)

    // Seguridad: Solo Admin o Asistente
    if (!session || !["ADMINISTRADOR", "ASISTENTE"].includes(session.user.role)) {
        redirect("/delegado")
    }

    const esAdmin = session.user.role === "ADMINISTRADOR"
    const miUserId = session.user.id

    // Lógica Inteligente de Filtro en Base de Datos:
    // Si es ADMIN: Ve TODOS los pagos.
    // Si es ASISTENTE: Ve los PENDIENTES de todos, y SOLO sus APROBADOS/RECHAZADOS.
    const filtroQuery: any = esAdmin
        ? {}
        : {
            OR: [
                { estado: 'PENDIENTE' },
                { cajeroId: miUserId }
            ]
        }

    // Traemos los pagos
    const pagos = await prisma.pago.findMany({
        where: filtroQuery,
        include: {
            cliente: true,
            cajero: true,
            _count: {
                select: { estudiantes: true }
            }
        },
        orderBy: [
            { estado: 'desc' }, // PENDIENTES primero
            { createdAt: 'desc' }
        ]
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Validación de Vouchers</h1>
                <p className="text-gray-600">Verifica depósitos y libera comprobantes.</p>
            </div>

            {/* ¡AQUÍ ESTABA EL ERROR DE TYPESCRIPT! */}
            {/* Ahora sí le pasamos las variables currentUserId y role que exige ListaPagos.tsx */}
            <ListaPagos
                iniciales={pagos}
                currentUserId={miUserId}
                role={session.user.role}
            />
        </div>
    )
}