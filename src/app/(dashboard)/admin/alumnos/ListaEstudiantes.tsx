//app\(dashboard)\admin\alumnos\ListaEstudiantes.tsx
"use client"

import { useState, useMemo } from "react"
import {
    Edit2, Trash2, AlertCircle, CheckCircle, Search,
    UserCheck, Printer, Users, Building2, UserCircle
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function ListaEstudiantes({ iniciales }: { iniciales: any[] }) {
    const router = useRouter()
    const [estudiantes, setEstudiantes] = useState(iniciales)
    const [busqueda, setBusqueda] = useState("")
    const [filtroTipo, setFiltroTipo] = useState("TODOS") // TODOS, LIBRE, DELEGADO, COLEGIO
    const [editando, setEditando] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [seleccionados, setSeleccionados] = useState<string[]>([])

    // 1. Ordenamiento Inteligente: Pendientes primero, luego por fecha más reciente
    const estudiantesOrdenados = useMemo(() => {
        return [...estudiantes].sort((a, b) => {
            const aPendiente = a.estadoRegistro !== 'COMPLETO' || a.pago?.estado !== 'APROBADO'
            const bPendiente = b.estadoRegistro !== 'COMPLETO' || b.pago?.estado !== 'APROBADO'

            // Si A es pendiente y B no, A va primero
            if (aPendiente && !bPendiente) return -1
            // Si B es pendiente y A no, B va primero
            if (!aPendiente && bPendiente) return 1

            // Si ambos tienen el mismo estado, ordenar por fecha (más reciente primero)
            const dateA = new Date(a.createdAt || 0).getTime()
            const dateB = new Date(b.createdAt || 0).getTime()
            return dateB - dateA
        })
    }, [estudiantes])

    // 2. Filtrado y Búsqueda Avanzada
    const filtrados = useMemo(() => {
        return estudiantesOrdenados.filter(e => {
            // Búsqueda de texto (Nombre, DNI, Institución)
            const terminoBusqueda = busqueda.toLowerCase()
            const matchSearch =
                e.nombres?.toLowerCase().includes(terminoBusqueda) ||
                e.apellidos?.toLowerCase().includes(terminoBusqueda) ||
                e.dni?.includes(busqueda) ||
                e.institucion?.toLowerCase().includes(terminoBusqueda) ||
                e.id.includes(busqueda)

            // Filtro por tipo de inscripción
            let matchFiltro = true
            const rolCreador = e.creador?.role || ""

            if (filtroTipo === 'LIBRE') {
                matchFiltro = rolCreador === 'LIBRE' || e.tipoColegio === 'LIBRE'
            } else if (filtroTipo === 'DELEGADO') {
                matchFiltro = rolCreador === 'DELEGADO'
            } else if (filtroTipo === 'COLEGIO') {
                matchFiltro = rolCreador === 'REPRESENTANTE_IE' || e.tipoColegio === 'ESTATAL' || e.tipoColegio === 'PARTICULAR'
            }

            return matchSearch && matchFiltro
        })
    }, [estudiantesOrdenados, busqueda, filtroTipo])

    // 3. Cálculo de Métricas
    const metricas = useMemo(() => {
        const libres = estudiantes.filter(e => e.creador?.role === 'LIBRE' || e.tipoColegio === 'LIBRE').length
        const delegados = estudiantes.filter(e => e.creador?.role === 'DELEGADO').length

        // Colegios únicos ignorando los que se llaman "Libre" o no tienen institución
        const colegiosSet = new Set(
            estudiantes
                .map(e => e.institucion?.trim().toUpperCase())
                .filter(inst => inst && inst !== "LIBRE" && inst !== "INDEPENDIENTE")
        )

        return { libres, delegados, colegiosUnicos: colegiosSet.size }
    }, [estudiantes])

    // 4. Funciones de Acción
    const handleEliminar = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este registro?")) return
        try {
            const res = await fetch(`/api/estudiantes/${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error)
            }
            setEstudiantes(estudiantes.filter(e => e.id !== id))
            // Quitar de seleccionados si estaba ahí
            setSeleccionados(prev => prev.filter(selId => selId !== id))
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

    // Lógica de Impresión
    const handleImprimirSeleccionados = () => {
        if (seleccionados.length === 0) return alert("Selecciona al menos un alumno aprobado.")
        const ids = seleccionados.join(',')
        router.push(`/admin/imprimir?ids=${ids}`)
    }

    const handleImprimirTodos = () => {
        const listos = filtrados.filter(e => e.estadoRegistro === 'COMPLETO' && e.pago?.estado === 'APROBADO')
        if (listos.length === 0) return alert("No hay alumnos listos (Aprobados y Completos) en la vista actual.")
        const ids = listos.map(e => e.id).join(',')
        router.push(`/admin/imprimir?ids=${ids}`)
    }

    // Lógica de Checkboxes
    const toggleSeleccion = (id: string) => {
        setSeleccionados(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    const toggleSeleccionarTodos = () => {
        // Solo seleccionar los que están listos para imprimir y son visibles
        const listosVisibles = filtrados
            .filter(e => e.estadoRegistro === 'COMPLETO' && e.pago?.estado === 'APROBADO')
            .map(e => e.id)

        if (listosVisibles.length === 0) return

        const todosSeleccionados = listosVisibles.every(id => seleccionados.includes(id))

        if (todosSeleccionados) {
            setSeleccionados([]) // Deseleccionar todos
        } else {
            setSeleccionados(listosVisibles) // Seleccionar todos los válidos
        }
    }

    return (
        <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        <UserCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Alumnos Libres</p>
                        <h4 className="text-2xl font-bold text-gray-800">{metricas.libres}</h4>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Por Delegados</p>
                        <h4 className="text-2xl font-bold text-gray-800">{metricas.delegados}</h4>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center space-x-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Colegios Diferentes</p>
                        <h4 className="text-2xl font-bold text-gray-800">{metricas.colegiosUnicos}</h4>
                    </div>
                </div>
            </div>


            <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex w-full md:w-auto gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar DNI, Nombre o Colegio..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                    >
                        <option value="TODOS">Todos los tipos</option>
                        <option value="LIBRE">Solo Libres</option>
                        <option value="DELEGADO">Por Delegados</option>
                        <option value="COLEGIO">Por Colegios</option>
                    </select>
                </div>

                <div className="flex w-full md:w-auto gap-2">
                    <button
                        onClick={handleImprimirSeleccionados}
                        disabled={seleccionados.length === 0}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold flex items-center justify-center transition-colors shadow-sm ${seleccionados.length > 0
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir Selección ({seleccionados.length})
                    </button>

                    <button
                        onClick={handleImprimirTodos}
                        className="flex-1 md:flex-none bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-bold flex items-center justify-center transition-colors shadow-sm"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Imp. Todos
                    </button>
                </div>
            </div>


            <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-max">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 w-12 text-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                                    onChange={toggleSeleccionarTodos}
                                    checked={
                                        filtrados.length > 0 &&
                                        filtrados.filter(e => e.estadoRegistro === 'COMPLETO' && e.pago?.estado === 'APROBADO').every(e => seleccionados.includes(e.id))
                                    }
                                />
                            </th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">DNI / Código</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Alumno</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Grado / Nivel</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filtrados.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                    No se encontraron alumnos con los filtros actuales.
                                </td>
                            </tr>
                        ) : (
                            filtrados.map((est) => {
                                const listo = est.estadoRegistro === 'COMPLETO' && est.pago?.estado === 'APROBADO';

                                return (
                                    <tr key={est.id} className={`hover:bg-gray-50 transition-colors ${!listo ? 'bg-orange-50/30' : ''}`}>
                                        <td className="p-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded text-blue-600 cursor-pointer disabled:opacity-50"
                                                checked={seleccionados.includes(est.id)}
                                                onChange={() => toggleSeleccion(est.id)}
                                                disabled={!listo} // No permitir seleccionar si no está listo para imprimir
                                                title={!listo ? "Faltan datos o pago pendiente" : "Seleccionar"}
                                            />
                                        </td>
                                        <td className="p-4">
                                            {listo ? (
                                                <span className="inline-flex items-center bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Completo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-xs font-bold">
                                                    <AlertCircle className="w-3 h-3 mr-1" /> Pendiente
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 font-mono text-sm text-gray-600">{est.dni || est.id.substring(0, 8)}</td>
                                        <td className="p-4">
                                            <p className="font-bold text-gray-800">{est.nombres || "SIN NOMBRE"} {est.apellidos}</p>
                                            <p className="text-xs text-gray-500 flex items-center mt-1">
                                                <Building2 className="w-3 h-3 mr-1" />
                                                {est.institucion || "Sin colegio"}
                                                <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] uppercase font-semibold">
                                                    {est.tipoColegio}
                                                </span>
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-medium text-gray-700">{est.gradoOEdad}</p>
                                            <p className="text-[10px] uppercase font-bold text-blue-500">{est.nivel}</p>
                                        </td>

                                        <td className="p-4">
                                            <div className="flex justify-center items-center space-x-2">
                                                <button
                                                    onClick={() => router.push(`/admin/imprimir?ids=${est.id}`)}
                                                    disabled={!listo}
                                                    className={`p-2 rounded-lg shadow-sm transition-colors ${listo ? "bg-blue-100 text-blue-600 hover:bg-blue-200" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                        }`}
                                                    title={listo ? "Imprimir Carnet" : "No disponible"}
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEditando(est)}
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEliminar(est.id)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>


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
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={editando.dni || ""}
                                        onChange={e => setEditando({ ...editando, dni: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Nombres</label>
                                    <input
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={editando.nombres || ""}
                                        onChange={e => setEditando({ ...editando, nombres: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Apellidos</label>
                                    <input
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={editando.apellidos || ""}
                                        onChange={e => setEditando({ ...editando, apellidos: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Institución</label>
                                    <input
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={editando.institucion || ""}
                                        onChange={e => setEditando({ ...editando, institucion: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setEditando(null)}
                                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-70"
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