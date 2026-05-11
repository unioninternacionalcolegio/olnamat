// app/(dashboard)/delegado/imprimir-carnet/page.tsx
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import CarnetDelegadoHorizontal from "@/components/CarnetDelegadoHorizontal"

export default async function ImprimirCarnetPage() {
    const session = await getServerSession(authOptions)

    // 1. Protección de ruta: Solo Delegados logueados
    if (!session || session.user.role !== "DELEGADO") {
        redirect("/login")
    }

    // 2. Obtener datos frescos del Delegado desde la BD
    const delegado = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            name: true,
            institucion: true,
        }
    })

    if (!delegado) {
        return <div className="p-10 text-center text-red-500 font-bold">Error: No se encontraron los datos del delegado.</div>
    }

    // 3. Renderizar el componente optimizado para impresión
    return (
        <CarnetDelegadoHorizontal
            nombreDelegado={delegado.name || "DELEGADO SIN NOMBRE"}
            nombreInstitucion={delegado.institucion || "INSTITUCIÓN POR COMPLETAR"}
        />
    )
}