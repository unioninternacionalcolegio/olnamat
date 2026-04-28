import FormInscripcion from "./FormInscripcion"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export default async function InscribirPage() {
    const session = await getServerSession(authOptions)

    // Traemos al usuario completo para saber de qué colegio es
    const usuario = await prisma.user.findUnique({
        where: { id: session?.user.id }
    })

    // Traemos los precios para la calculadora
    const configuraciones = await prisma.configuracionConcurso.findMany()

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Inscripción Masiva</h1>
                <p className="text-gray-600">Agrega a tus estudiantes y sube el comprobante de pago al finalizar.</p>
            </div>

            {/* Le pasamos los precios y el colegio del delegado */}
            <FormInscripcion
                precios={configuraciones}
                userInstitucion={usuario?.institucion || "I.E. Independiente"}
            />
        </div>
    )
}