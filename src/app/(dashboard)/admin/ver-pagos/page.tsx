import prisma from "@/lib/prisma"
import ListaPagos from "./ListaPagos"

export default async function VerPagosPage() {
    // Traemos los pagos, dando prioridad a los PENDIENTES
    const pagos = await prisma.pago.findMany({
        include: {
            cliente: true,
            _count: {
                select: { estudiantes: true }
            }
        },
        orderBy: [
            { estado: 'desc' }, // PENDIENTES suelen ir primero alfabéticamente si manejas bien los strings
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