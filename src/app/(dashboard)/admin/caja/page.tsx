// src/app/(dashboard)/admin/caja/page.tsx
import CajaPOS from "./CajaPOS"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function CajaPage() {
    const session = await getServerSession(authOptions)
    const cajeroId = session?.user?.id || ""

    const clientes = await prisma.user.findMany({
        where: {
            role: { in: ["LIBRE", "DELEGADO", "REPRESENTANTE_IE"] }
        },
        select: {
            id: true,
            name: true,
            dni: true,
            institucion: true,
            role: true,
            tipoColegio: true
        }
    })

    const configuraciones = await prisma.configuracionConcurso.findMany()

    // NUEVO: Traemos los descuentos por colegio
    const descuentosColegios = await prisma.descuentoColegio.findMany()

    return (
        <div className="p-6">
            <h1 className="text-2xl font-black mb-6">Módulo de Caja</h1>
            <CajaPOS
                clientes={clientes}
                configuraciones={configuraciones}
                cajeroId={cajeroId}
                descuentosColegios={descuentosColegios} // <- Pasamos el prop
            />
        </div>
    )
}