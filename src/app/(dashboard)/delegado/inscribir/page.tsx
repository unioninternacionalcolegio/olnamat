// app/(dashboard)/delegado/inscribir/page.tsx
import FormInscripcion from "./FormInscripcion"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function InscribirGeneralPage() {
    // 1. Obtenemos la sesión actual
    const session = await getServerSession(authOptions)

    // Solo validamos que exista una sesión activa (sin exigir el email)
    if (!session || !session.user) redirect("/login")

    // Buscamos al delegado de forma inteligente (ya que el email es opcional)
    const delegado = await prisma.user.findFirst({
        where: session.user.email
            ? { email: session.user.email }
            : { name: session.user.name }
    })

    // 3. Traemos los precios
    const configuraciones = await prisma.configuracionConcurso.findMany()

    // 4. NUEVO: Traemos el descuento especial si el colegio lo tiene
    let descuentoColegioActivo = 0;
    if (delegado?.institucion) {
        const instLimpia = delegado.institucion.toUpperCase().replace("LIBRE-", "").trim();
        const descuentoReg = await prisma.descuentoColegio.findFirst({
            where: { institucion: instLimpia }
        });
        if (descuentoReg) {
            descuentoColegioActivo = descuentoReg.descuento;
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-800">Inscripción General</h1>
                <p className="text-gray-500 text-sm">Inscribe alumnos de cualquier nivel educativo.</p>
            </div>

            {/* AQUÍ ESTÁ LA JUGADA: Le pasamos los datos del delegado y el descuento */}
            <FormInscripcion
                precios={configuraciones}
                userInstitucion={delegado?.institucion || "INDEPENDIENTE"}
                userTipoColegio={delegado?.tipoColegio || "ESTATAL"}
                descuentoPorColegio={descuentoColegioActivo} // <- NUEVO PROP PASADO
            // Sin nivelFijo, para que pueda elegir libremente
            />
        </div>
    )
}