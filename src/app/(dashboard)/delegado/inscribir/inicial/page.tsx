import FormInscripcion from "../FormInscripcion" // Sube un nivel para encontrar el componente
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function InscribirInicialPage() {
    const session = await getServerSession(authOptions)

    // Solo validamos que exista una sesión activa (sin exigir el email)
    if (!session || !session.user) redirect("/login")

    // Buscamos al delegado de forma inteligente (ya que el email es opcional)
    // Usamos findFirst y buscamos por email, o si no tiene, por su nombre exacto
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
                nivelFijo="INICIAL" // <-- ESTO BLOQUEA EL FORMULARIO SOLO PARA INICIAL
            />
        </div>
    )
}