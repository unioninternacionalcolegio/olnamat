import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import ListaEstudiantes from "./ListaEstudiantes"

export default async function AlumnosPage() {
    const session = await getServerSession(authOptions)

    // Obtenemos los alumnos del usuario logueado
    // Si es ADMIN, ve todos. Si es DELEGADO/LIBRE, solo los suyos.
    const query: any = {}
    if (session?.user.role !== 'ADMINISTRADOR' && session?.user.role !== 'ASISTENTE') {
        query.creadorId = session?.user.id
    }

    const estudiantes = await prisma.estudiante.findMany({
        where: query,
        include: {
            pago: true
        },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inscripción de Alumnos</h1>
                    <p className="text-gray-600">Gestiona los datos de tus participantes e imprime sus carnets.</p>
                </div>
            </div>

            <ListaEstudiantes iniciales={estudiantes} />
        </div>
    )
}