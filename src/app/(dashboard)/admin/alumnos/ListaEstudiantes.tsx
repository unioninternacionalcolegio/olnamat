"use client"

import { useState } from "react"
import { Edit2, Trash2, AlertCircle, CheckCircle, Search, UserCheck, Printer } from "lucide-react" // Añadimos Printer
import { useRouter } from "next/navigation"

export default function ListaEstudiantes({ iniciales }: { iniciales: any[] }) {
    const router = useRouter()
    const [estudiantes, setEstudiantes] = useState(iniciales)
    const [busqueda, setBusqueda] = useState("")
    const [editando, setEditando] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    // Filtrado simple
    const filtrados = estudiantes.filter(e =>
    (e.nombres?.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.dni?.includes(busqueda) ||
        e.id.includes(busqueda))
    )

    const handleEliminar = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este registro?")) return

        try {
            const res = await fetch(`/api/estudiantes/${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error)
            }
            setEstudiantes(estudiantes.filter(e => e.id !== id))
        } catch (err: any) {
            alert(err.message)
        }
    }

    const handleGuardarCambios = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch(`/api/estudiantes/${editando.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editando)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setEstudiantes(estudiantes.map(est => est.id === data.id ? data : est))
            setEditando(null)
            router.refresh()
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleImprimirCarnet = (id: string) => {
        router.push(`/admin/imprimir?ids=${id}`)
    }
    const handleImprimirTodos = () => {
        // Filtramos solo los que están listos para imprimir
        const listos = filtrados.filter(e => e.estadoRegistro === 'COMPLETO' && e.pago?.estado === 'APROBADO')
        if (listos.length === 0) return alert("No hay alumnos listos (Aprobados y Completos) para imprimir.")

        // Obtenemos todos los IDs separados por coma
        const ids = listos.map(e => e.id).join(',')
        router.push(`/admin/imprimir?ids=${ids}`)
    }
    return (
        <div className="space-y-4">
            {/* Buscador y Filtros */}
            <div className="bg-white p-4 rounded-xl shadow-sm border flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por DNI o Nombre..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>
            <button
                onClick={handleImprimirTodos}
                className="w-full sm:w-auto bg-gray-300 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-bold flex items-center justify-center transition-colors shadow-sm"
            >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Todos Aprobados
            </button>

            {/* Tabla de Estudiantes */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">DNI / Código</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Alumno</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Grado / Nivel</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Carnet</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filtrados.map((est) => (
                            <tr key={est.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    {est.estadoRegistro === 'COMPLETO' ? (
                                        <span className="flex items-center text-green-600 text-xs font-bold">
                                            <CheckCircle className="w-3 h-3 mr-1" /> Completo
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-amber-500 text-xs font-bold">
                                            <AlertCircle className="w-3 h-3 mr-1" /> Incompleto
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 font-mono text-sm">{est.dni || est.id.substring(0, 8)}</td>
                                <td className="p-4">
                                    <p className="font-bold text-gray-800">{est.nombres || "SIN NOMBRE"} {est.apellidos}</p>
                                    <p className="text-xs text-gray-500">{est.institucion}</p>
                                </td>
                                <td className="p-4">
                                    <p className="text-sm">{est.gradoOEdad}</p>
                                    <p className="text-[10px] uppercase font-bold text-blue-500">{est.nivel}</p>
                                </td>

                                {/* AQUI VA LA LÓGICA DE IMPRESIÓN */}
                                <td className="p-4 text-center">
                                    {est.pago?.estado === 'APROBADO' && est.estadoRegistro === 'COMPLETO' ? (
                                        <button
                                            onClick={() => handleImprimirCarnet(est.id)}
                                            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                            title="Imprimir Carnet"
                                        >
                                            <Printer className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <span className="text-[10px] text-gray-400 italic font-medium">
                                            {est.pago?.estado !== 'APROBADO' ? "Pago Pdte." : "Faltan Datos"}
                                        </span>
                                    )}
                                </td>

                                <td className="p-4">
                                    <div className="flex justify-center space-x-2">
                                        <button
                                            onClick={() => setEditando(est)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleEliminar(est.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Edición (Queda Igual) */}
            {editando && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-4 flex items-center">
                            <UserCheck className="mr-2 text-blue-600" />
                            {editando.estadoRegistro === 'INCOMPLETO' ? 'Completar Datos' : 'Editar Alumno'}
                        </h3>
                        <form onSubmit={handleGuardarCambios} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">DNI</label>
                                    <input
                                        className="w-full p-2 border rounded"
                                        value={editando.dni || ""}
                                        onChange={e => setEditando({ ...editando, dni: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Nombres</label>
                                    <input
                                        className="w-full p-2 border rounded"
                                        value={editando.nombres || ""}
                                        onChange={e => setEditando({ ...editando, nombres: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Apellidos</label>
                                    <input
                                        className="w-full p-2 border rounded"
                                        value={editando.apellidos || ""}
                                        onChange={e => setEditando({ ...editando, apellidos: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Institución</label>
                                    <input
                                        className="w-full p-2 border rounded"
                                        value={editando.institucion || ""}
                                        onChange={e => setEditando({ ...editando, institucion: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setEditando(null)}
                                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                                >
                                    {loading ? "Guardando..." : "Guardar Cambios"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}