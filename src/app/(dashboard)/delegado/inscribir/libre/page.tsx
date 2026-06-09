// app/(dashboard)/delegado/inscribir/libre/page.tsx
import FormInscripcion from "../FormInscripcion" // Sube los niveles necesarios para encontrar el componente
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function InscribirLibrePage() {
    // 1. Obtenemos la sesión actual
    const session = await getServerSession(authOptions)

    // Solo validamos que exista una sesión activa
    if (!session || !session.user) redirect("/login")

    // 2. Buscamos al delegado de forma inteligente
    const delegado = await prisma.user.findFirst({
        where: session.user.email
            ? { email: session.user.email }
            : { name: session.user.name }
    })

    // 3. Traemos las configuraciones de precios
    const configuraciones = await prisma.configuracionConcurso.findMany()

    // 4. Traemos el descuento especial si el colegio lo tiene
    let descuentoColegioActivo = 0;
    if (delegado?.institucion) {
        // Limpiamos el nombre por si ya tiene la palabra LIBRE antes de buscar el descuento
        const instLimpia = delegado.institucion.toUpperCase().replace("LIBRE-", "").trim();
        const descuentoReg = await prisma.descuentoColegio.findFirst({
            where: { institucion: instLimpia }
        });
        if (descuentoReg) {
            descuentoColegioActivo = descuentoReg.descuento;
        }
    }

    // 5. Construimos el nombre de la institución anteponiendo "LIBRE-"
    const nombreInstitucionBase = delegado?.institucion || "INDEPENDIENTE";
    const nombreInstitucionLibre = nombreInstitucionBase.toUpperCase().startsWith("LIBRE-") 
        ? nombreInstitucionBase 
        : `LIBRE-${nombreInstitucionBase}`;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-blue-800">Inscripción Libres</h1>
                <p className="text-gray-500 text-sm">Registra únicamente a alumnos en modalidad libre.</p>
            </div>

            {/* Le pasamos la data forzando el modo LIBRE */}
            <FormInscripcion
                precios={configuraciones}
                userInstitucion={nombreInstitucionLibre}
                userTipoColegio="LIBRE" // <- Forzamos la tarifa libre
                descuentoPorColegio={descuentoColegioActivo} // <- Pasamos el descuento si existe
            />
        </div>
    )
}