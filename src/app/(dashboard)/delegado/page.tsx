import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { UserPlus, Printer, Clock, CheckCircle, Search } from "lucide-react"

export default async function PanelDelegado() {
    const session = await getServerSession(authOptions)

    // 1. Buscamos al usuario completo en la BD para evitar el error de TS
    const usuarioActual = await prisma.user.findUnique({
        where: { id: session?.user.id }
    })

    // 2. Traemos los alumnos del delegado
    const estudiantes = await prisma.estudiante.findMany({
        where: { creadorId: session?.user.id },
        include: { pago: true },
        orderBy: { createdAt: 'desc' }
    })

    // Estadísticas rápidas
    const total = estudiantes.length
    const aprobados = estudiantes.filter(e => e.pago?.estado === 'APROBADO').length
    const pendientes = total - aprobados

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {session?.user.name}</h1>
                    <p className="text-gray-600">IE: {usuarioActual?.institucion || 'Independiente'} | {usuarioActual?.localidad || 'Sin localidad'}</p>
                </div>
                <Link
                    href="/delegado/inscribir"
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center shadow-lg hover:bg-blue-700 transition"
                >
                    <UserPlus className="w-5 h-5 mr-2" /> Nueva Inscripción Masiva
                </Link>
            </div>

            {/* Cards de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600"><UserPlus className="w-6 h-6" /></div>
                    <div><p className="text-sm text-gray-500">Total Inscritos</p><p className="text-2xl font-bold">{total}</p></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center space-x-4">
                    <div className="bg-amber-100 p-3 rounded-full text-amber-600"><Clock className="w-6 h-6" /></div>
                    <div><p className="text-sm text-gray-500">Pendientes de Pago</p><p className="text-2xl font-bold">{pendientes}</p></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center space-x-4">
                    <div className="bg-green-100 p-3 rounded-full text-green-600"><CheckCircle className="w-6 h-6" /></div>
                    <div><p className="text-sm text-gray-500">Listos para Carnet</p><p className="text-2xl font-bold">{aprobados}</p></div>
                </div>
            </div>

            {/* Tabla de Alumnos */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold">Mis Participantes</h3>
                    <Link
                        href={`/admin/imprimir?ids=${estudiantes.filter(e => e.pago?.estado === 'APROBADO').map(e => e.id).join(',')}`}
                        className={`flex items-center text-sm font-bold ${aprobados > 0 ? 'text-blue-600' : 'text-gray-300 pointer-events-none'}`}
                    >
                        <Printer className="w-4 h-4 mr-1" /> Imprimir Carnets Aprobados
                    </Link>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-white border-b">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Alumno</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Grado</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Estado Pago</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {estudiantes.map((est) => (
                            <tr key={est.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <p className="font-bold text-gray-800">{est.nombres || "PENDIENTE"} {est.apellidos}</p>
                                    <p className="text-xs text-gray-500">DNI: {est.dni || 'Sin datos'}</p>
                                </td>
                                <td className="p-4">
                                    <p className="text-sm font-medium">{est.gradoOEdad}</p>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase">{est.nivel}</p>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${est.pago?.estado === 'APROBADO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {est.pago?.estado}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    {est.pago?.estado === 'APROBADO' ? (
                                        <Link href={`/admin/imprimir?ids=${est.id}`} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg inline-block">
                                            <Printer className="w-4 h-4" />
                                        </Link>
                                    ) : (
                                        <Clock className="w-4 h-4 text-gray-300 mx-auto" />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}