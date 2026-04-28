import FormInscripcion from "./FormInscripcion"
import prisma from "@/lib/prisma"

export default async function InscribirPage() {
    // Traemos los precios para que el formulario calcule en vivo
    const configuraciones = await prisma.configuracionConcurso.findMany()

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Inscripción Masiva</h1>
                <p className="text-gray-600">Agrega a tus estudiantes y sube el comprobante de pago al finalizar.</p>
            </div>

            {/* Pasamos los precios al componente cliente */}
            <FormInscripcion precios={configuraciones} />
        </div>
    )
}