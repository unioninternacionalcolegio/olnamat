import FormInscripcion from "../FormInscripcion" // Sube los niveles necesarios para encontrar el componente
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function InscribirLibrePage() {
    const session = await getServerSession(authOptions)

    // Solo validamos que exista una sesión activa
    if (!session || !session.user) redirect("/login")

    const delegado = await prisma.user.findFirst({
        where: session.user.email
            ? { email: session.user.email }
            : { name: session.user.name }
    })

    const configuraciones = await prisma.configuracionConcurso.findMany()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-blue-800">Inscripción Libres</h1>
                <p className="text-gray-500 text-sm">Registra únicamente a alumnos en modalidad libre.</p>
            </div>

            <FormInscripcion
                precios={configuraciones}
                userInstitucion={"ALUMNO LIBRE"}
                userTipoColegio={"LIBRE"} // <-- CORRECCIÓN: Tiene que ser exactamente "LIBRE" (el valor del Enum)
            />
        </div>
    )
}