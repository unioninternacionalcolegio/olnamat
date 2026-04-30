// src/app/(dashboard)/admin/caja/page.tsx
import CajaPOS from "./CajaPOS"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
// OJO: Importa authOptions desde donde lo tengas configurado. 
// Normalmente es "@/lib/auth" o "@/app/api/auth/[...nextauth]/route"
import { authOptions } from "@/lib/auth"

export default async function CajaPage() {
    // 1. Obtenemos la sesión del usuario logueado (La secretaria/cajero)
    const session = await getServerSession(authOptions)

    // Si no hay sesión por alguna razón, mandamos un string vacío para que la API no explote,
    // o el ID real del cajero.
    const cajeroId = session?.user?.id || ""

    // 2. Traemos a todos los delegados y libres
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

    // 3. Traemos las configuraciones de precios
    const configuraciones = await prisma.configuracionConcurso.findMany()

    return (
        <div className="p-6">
            <h1 className="text-2xl font-black mb-6">Módulo de Caja</h1>
            {/* Pasamos TODOS los props, incluyendo el cajeroId vital */}
            <CajaPOS
                clientes={clientes}
                configuraciones={configuraciones}
                cajeroId={cajeroId}
            />
        </div>
    )
}