import FormInscripcion from "../FormInscripcion"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function InscribirInicialPage() {
    const session = await getServerSession(authOptions)

    // 1. Corrección aquí: Validamos solo la sesión
    if (!session || !session.user) redirect("/login")

    // 2. Corrección aquí: Buscamos por email o nombre
    const delegado = await prisma.user.findFirst({
        where: session.user.email
            ? { email: session.user.email }
            : { name: session.user.name }
    })

    const configuraciones = await prisma.configuracionConcurso.findMany()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-blue-800">Inscripción - Nivel Inicial</h1>
                <p className="text-gray-500 text-sm">Registra únicamente a estudiantes de 3, 4 y 5 años.</p>
            </div>

            <FormInscripcion
                precios={configuraciones}
                userInstitucion={delegado?.institucion || "INDEPENDIENTE"}
                userTipoColegio={delegado?.tipoColegio || "ESTATAL"}
                nivelFijo="SECUNDARIA"
            />
        </div>
    )
}