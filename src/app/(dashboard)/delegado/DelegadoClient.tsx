"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { UserPlus, Printer, Clock, CheckCircle, Search, Filter, CheckSquare } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DelegadoClient({ estudiantes, usuario, sessionName }: { estudiantes: any[], usuario: any, sessionName: string }) {
    const router = useRouter()

    // Estados para los filtros
    const [filtroNivel, setFiltroNivel] = useState("TODOS")
    const [filtroGrado, setFiltroGrado] = useState("TODOS")
    const [busqueda, setBusqueda] = useState("") // <-- NUEVO: Estado para el buscador

    // Estado para guardar los IDs de los carnets seleccionados (la memoria)
    const [seleccionados, setSeleccionados] = useState<string[]>([])

    // 1. Estadísticas Generales
    const total = estudiantes.length
    const aprobados = estudiantes.filter(e => e?.pago?.estado === 'APROBADO').length
    const pendientes = total - aprobados

    // 2. Agrupación Matemática Inteligente (Conteos por Nivel y Grado)
    const conteos = useMemo(() => {
        const resumen: Record<string, { total: number, grados: Record<string, number> }> = {
            INICIAL: { total: 0, grados: {} },
            PRIMARIA: { total: 0, grados: {} },
            SECUNDARIA: { total: 0, grados: {} }
        }

        estudiantes.forEach(est => {
            const n = est.nivel as string
            const g = est.gradoOEdad as string
            if (resumen[n]) {
                resumen[n].total++
                resumen[n].grados[g] = (resumen[n].grados[g] || 0) + 1
            }
        })
        return resumen
    }, [estudiantes])

    // 3. Lógica de Filtrado en Vivo (Ahora incluye el buscador de texto)
    const estudiantesFiltrados = useMemo(() => {
        return estudiantes.filter(e => {
            const cumpleNivel = filtroNivel === "TODOS" || e.nivel === filtroNivel
            const cumpleGrado = filtroGrado === "TODOS" || e.gradoOEdad === filtroGrado

            // Lógica del buscador por texto (Ignora mayúsculas y espacios extra)
            const termino = busqueda.toLowerCase().trim()
            const nombreCompleto = `${e.nombres || ""} ${e.apellidos || ""}`.toLowerCase()
            const dni = (e.dni || "").toLowerCase()
            const cumpleBusqueda = termino === "" || nombreCompleto.includes(termino) || dni.includes(termino)

            return cumpleNivel && cumpleGrado && cumpleBusqueda
        })
    }, [estudiantes, filtroNivel, filtroGrado, busqueda])

    // 4. Lógica de Checkboxes
    const toggleSeleccion = (id: string) => {
        setSeleccionados(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    // Seleccionar todos los APROBADOS VISIBLES actualmente en la tabla filtrada
    const aprobadosFiltrados = estudiantesFiltrados.filter(e => e?.pago?.estado === 'APROBADO')
    const todosVisiblesSeleccionados = aprobadosFiltrados.length > 0 && aprobadosFiltrados.every(e => seleccionados.includes(e.id))

    const toggleSelectAll = () => {
        if (todosVisiblesSeleccionados) {
            // Deseleccionamos los que están visibles actualmente
            const idsVisibles = aprobadosFiltrados.map(e => e.id)
            setSeleccionados(prev => prev.filter(id => !idsVisibles.includes(id)))
        } else {
            // Seleccionamos los visibles actuales sin borrar los que ya estaban en memoria
            const nuevosSeleccionados = new Set(seleccionados)
            aprobadosFiltrados.forEach(e => nuevosSeleccionados.add(e.id))
            setSeleccionados(Array.from(nuevosSeleccionados))
        }
    }

    // Grados disponibles para el select secundario basados en el nivel elegido
    const gradosDelNivelElegido = useMemo(() => {
        if (filtroNivel === "TODOS") return []
        return Object.keys(conteos[filtroNivel]?.grados || {}).sort()
    }, [filtroNivel, conteos])

    // Al cambiar de nivel, reseteamos el grado a TODOS
    const handleNivelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFiltroNivel(e.target.value)
        setFiltroGrado("TODOS")
    }

    return (
        <div className="space-y-6">
            {/* ENCABEZADO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {sessionName}</h1>
                    <p className="text-gray-600">IE: {usuario?.institucion || 'Independiente'} | {usuario?.localidad || 'Sin localidad'}</p>
                </div>
                <Link
                    href="/delegado/inscribir"
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center shadow-lg hover:bg-blue-700 transition"
                >
                    <UserPlus className="w-5 h-5 mr-2" /> Nueva Inscripción Masiva
                </Link>
            </div>

            {/* CARDS DE RESUMEN GENERAL */}
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

            {/* CONTEO DETALLADO POR NIVEL Y GRADO */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center"><Search className="w-5 h-5 mr-2" /> Resumen Detallado de Inscripciones</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(conteos).map(([nivel, datos]) => (
                        <div key={nivel} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-2">
                                <span className="font-black text-blue-800 uppercase text-sm">{nivel}</span>
                                <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{datos.total} alumnos</span>
                            </div>
                            <div className="space-y-1">
                                {Object.keys(datos.grados).length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">Sin registros</p>
                                ) : (
                                    Object.entries(datos.grados).map(([grado, cantidad]) => (
                                        <div key={grado} className="flex justify-between text-xs text-gray-600">
                                            <span>{grado}</span>
                                            <span className="font-bold">{cantidad}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* TABLA INTERACTIVA */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Cabecera de controles (Buscador, Filtros y Botón de Imprimir) */}
                <div className="p-4 border-b bg-gray-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">

                        {/* NUEVO: BARRA DE BÚSQUEDA */}
                        <div className="relative w-full md:w-64">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Buscar alumno o DNI..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="pl-9 p-2 border rounded-lg text-sm w-full bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Filter className="w-5 h-5 text-gray-400 hidden md:block" />
                            <select value={filtroNivel} onChange={handleNivelChange} className="p-2 border rounded-lg text-sm font-bold bg-white text-gray-700 w-full md:w-auto">
                                <option value="TODOS">Todos los Niveles</option>
                                <option value="INICIAL">INICIAL</option>
                                <option value="PRIMARIA">PRIMARIA</option>
                                <option value="SECUNDARIA">SECUNDARIA</option>
                            </select>

                            <select value={filtroGrado} onChange={(e) => setFiltroGrado(e.target.value)} disabled={filtroNivel === "TODOS"} className="p-2 border rounded-lg text-sm font-bold bg-white text-gray-700 w-full md:w-auto disabled:bg-gray-100">
                                <option value="TODOS">Todos los Grados</option>
                                {gradosDelNivelElegido.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Link
                        href={seleccionados.length > 0 ? `/admin/imprimir?ids=${seleccionados.join(',')}` : "#"}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm w-full lg:w-auto justify-center ${seleccionados.length > 0
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-400 pointer-events-none'
                            }`}
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir {seleccionados.length > 0 ? `(${seleccionados.length}) Seleccionados` : 'Carnets'}
                    </Link>
                </div>

                {/* Tabla de Alumnos */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white border-b">
                            <tr>
                                <th className="p-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 cursor-pointer"
                                        disabled={aprobadosFiltrados.length === 0}
                                        checked={todosVisiblesSeleccionados && aprobadosFiltrados.length > 0}
                                        onChange={toggleSelectAll}
                                        title="Seleccionar todos los aprobados visibles"
                                    />
                                </th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Alumno</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Grado</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase text-center">Estado Pago</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {estudiantesFiltrados.map((est) => {
                                const isAprobado = est?.pago?.estado === 'APROBADO'
                                const isSelected = seleccionados.includes(est.id)

                                return (
                                    <tr key={est.id} className={`transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                                        <td className="p-4 text-center">
                                            {isAprobado ? (
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => toggleSeleccion(est.id)}
                                                />
                                            ) : (
                                                <span title="Pendiente de pago" className="flex justify-center">
                                                    <Clock className="w-4 h-4 text-gray-300" />
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-gray-800">{est.nombres || "PENDIENTE"} {est.apellidos}</p>
                                            <p className="text-xs text-gray-500">DNI: {est.dni || 'Sin datos'}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-medium">{est.gradoOEdad}</p>
                                            <p className="text-[10px] text-blue-500 font-bold uppercase">{est.nivel}</p>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${isAprobado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {est?.pago?.estado}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                            {estudiantesFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500 font-bold">
                                        No hay estudiantes que coincidan con la búsqueda o filtros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}