import prisma from "@/lib/prisma"
import CajaPOS from "./CajaPOS"

export default async function CajaPage() {
    // Obtenemos a todos los usuarios que pueden comprar cupos (Delegados, IEs, Libres)
    const clientes = await prisma.user.findMany({
        where: {
            role: { in: ["DELEGADO", "REPRESENTANTE_IE", "LIBRE"] }
        },
        select: {
            id: true,
            name: true,
            dni: true,
            institucion: true,
            role: true
        },
        orderBy: { name: 'asc' }
    })

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Caja Rápida / Venta Extemporánea</h1>
                <p className="text-gray-600">Vende cupos en blanco para que el delegado los llene después.</p>
            </div>

            {/* Pasamos los clientes al componente interactivo */}
            <CajaPOS clientes={clientes} />
        </div>
    )
}