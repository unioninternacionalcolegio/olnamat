import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ListaInicialPage() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) redirect("/login")

    const delegado = await prisma.user.findFirst({
        where: session.user.email ? { email: session.user.email } : { name: session.user.name }
    })
    if (!delegado) redirect("/login")

    // Buscamos a TODOS los estudiantes de este delegado para el nivel INICIAL
    const estudiantes = await prisma.estudiante.findMany({
        where: {
            creadorId: delegado.id,
            nivel: "PRIMARIA" // Para Primaria, cambia esto a "PRIMARIA"
        },
        orderBy: [
            { gradoOEdad: 'asc' },
            { apellidos: 'asc' }
        ]
    })

    // Agrupamos dinámicamente los estudiantes por Grado/Edad
    const gradosUnicos = Array.from(new Set(estudiantes.map(e => e.gradoOEdad)))

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-blue-800">Lista de Inscritos - Nivel Inicial</h1>
                <p className="text-gray-500 text-sm">Registro completo de todos tus estudiantes matriculados en este nivel.</p>
            </div>

            {gradosUnicos.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-500">
                    No tienes estudiantes registrados en este nivel.
                </div>
            ) : (
                <div className="space-y-8">
                    {gradosUnicos.map((grado) => {
                        const alumnosEnGrado = estudiantes.filter(e => e.gradoOEdad === grado)
                        return (
                            <div key={grado} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Cabecera de la tabla (Grado y Total) */}
                                <div className="bg-blue-50 border-b border-blue-100 p-4 flex justify-between items-center">
                                    <h2 className="text-lg font-black text-blue-800">{grado}</h2>
                                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                        Total: {alumnosEnGrado.length}
                                    </span>
                                </div>
                                
                                {/* Tabla */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-gray-600">
                                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b">
                                            <tr>
                                                <th className="px-4 py-3 w-12 text-center">#</th>
                                                <th className="px-4 py-3">Código / DNI</th>
                                                <th className="px-4 py-3">Apellidos</th>
                                                <th className="px-4 py-3">Nombres</th>
                                                <th className="px-4 py-3">Nivel</th>
                                                <th className="px-4 py-3">Colegio</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {alumnosEnGrado.map((alum, index) => (
                                                <tr key={alum.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 text-center font-bold text-gray-400">{index + 1}</td>
                                                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{alum.dni}</td>
                                                    <td className="px-4 py-3 font-bold uppercase">{alum.apellidos}</td>
                                                    <td className="px-4 py-3 uppercase">{alum.nombres}</td>
                                                    <td className="px-4 py-3 text-xs font-bold text-gray-400">{alum.nivel}</td>
                                                    <td className="px-4 py-3 text-xs uppercase">{alum.institucion}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}