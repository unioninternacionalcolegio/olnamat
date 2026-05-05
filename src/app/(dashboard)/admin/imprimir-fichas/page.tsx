// src/app/(dashboard)/admin/imprimir-fichas/page.tsx
import prisma from "@/lib/prisma"
import VistaImpresionFichas from "./VistaImpresionFichas"

export default async function PageFichasOpticas(props: {
    searchParams: Promise<{ nivel?: string; grado?: string }>
}) {
    const searchParams = await props.searchParams;
    const nivelStr = searchParams.nivel;
    const gradoStr = searchParams.grado;

    // 1. Validamos que la URL tenga los datos necesarios
    if (!nivelStr || !gradoStr) {
        return (
            <div className="p-10 text-center bg-white rounded-xl shadow-sm border border-dashed border-gray-300 max-w-2xl mx-auto mt-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Parámetros insuficientes</h2>
                <p className="text-gray-500">
                    No se ha seleccionado un grado o nivel. Regresa al panel de pruebas para elegir uno.
                </p>
            </div>
        )
    }

    // 2. Buscamos la configuración en la base de datos
    // Esto nos dirá cuántas preguntas tiene el examen (ej. 10, 20 o 40)
    const configuracion = await prisma.configuracionConcurso.findFirst({
        where: {
            nivel: nivelStr,
            gradoOEdad: gradoStr
        }
    })

    // 3. Si no existe configuración, avisamos al usuario
    if (!configuracion) {
        return (
            <div className="p-10 text-center bg-red-50 rounded-xl shadow-sm border border-red-200 max-w-2xl mx-auto mt-10">
                <h2 className="text-2xl font-bold text-red-700 mb-2">Configuración no encontrada</h2>
                <p className="text-red-600">
                    No existe una configuración de examen para <strong>{gradoStr}</strong> de <strong>{nivelStr}</strong>.
                </p>
            </div>
        )
    }

    // 4. Renderizamos la Vista Inteligente pasándole la configuración
    return (
        <VistaImpresionFichas configuracion={configuracion as any} />
    )
}