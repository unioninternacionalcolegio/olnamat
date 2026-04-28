import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import ListaPagos from "./ListaPagos"

export default async function VerPagosPage() {
    const session = await getServerSession(authOptions)

    // 🔒 EL CANDADO DE SEGURIDAD
    // Si no hay sesión, o si el rol NO ES Administrador ni Asistente (Secretaria), lo pateamos.
    if (!session || !["ADMINISTRADOR", "ASISTENTE"].includes(session.user.role)) {
        redirect("/delegado") // Lo mandamos a su propio panel para que no husmee
    }

    // Traemos los pagos, dando prioridad a los PENDIENTES
    const pagos = await prisma.pago.findMany({
        include: {
            cliente: true,
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
                <h1 className="text-2xl font-bold text-gray-900">Validación de Vouchers</h1>
                <p className="text-gray-600">Verifica las transferencias y depósitos para liberar los carnets.</p>
            </div>

            <ListaPagos iniciales={pagos} />
        </div>
    )
}