"use client"

import { useState, useMemo } from "react"
import { Search, Save, CheckCircle, AlertTriangle, Edit2 } from "lucide-react"
import { useRouter } from "next/navigation"

type PanelNotasProps = {
    estudiantes: any[]
    configuraciones: any[]
}

export default function PanelNotas({ estudiantes, configuraciones }: PanelNotasProps) {
    const router = useRouter()
    const [busqueda, setBusqueda] = useState("")
    const [estudianteActivo, setEstudianteActivo] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    // Estado del formulario de notas
    const [correctas, setCorrectas] = useState<number | "">("")
    const [incorrectas, setIncorrectas] = useState<number | "">("")
    const [enBlanco, setEnBlanco] = useState<number | "">("")
    const [horaSalida, setHoraSalida] = useState("")

    // Filtrado de alumnos en el buscador superior
    const alumnosFiltrados = useMemo(() => {
        if (busqueda.length < 2) return []
        return estudiantes.filter(e =>
            e.dni?.includes(busqueda) ||
            `${e.nombres} ${e.apellidos}`.toLowerCase().includes(busqueda.toLowerCase())
        ).slice(0, 5) // Mostramos máximo 5 resultados rápidos
    }, [busqueda, estudiantes])

    // Obtener la regla de calificación para el alumno seleccionado
    const configActual = useMemo(() => {
        if (!estudianteActivo) return null
        return configuraciones.find(c =>
            c.nivel === estudianteActivo.nivel && c.gradoOEdad === estudianteActivo.gradoOEdad
        ) || {
            // Valores por defecto "salvavidas" por si el Admin olvidó crear la configuración
            cantidadPreguntas: 20,
            puntosCorrecto: 10,
            puntosIncorrecto: -1,
            puntosBlanco: 0
        }
    }, [estudianteActivo, configuraciones])

    // Cálculo automático del puntaje total
    const puntajeTotal = useMemo(() => {
        if (!configActual) return 0
        const c = Number(correctas) || 0
        const i = Number(incorrectas) || 0
        const b = Number(enBlanco) || 0
        return (c * configActual.puntosCorrecto) + (i * configActual.puntosIncorrecto) + (b * configActual.puntosBlanco)
    }, [correctas, incorrectas, enBlanco, configActual])

    // Validaciones
    const totalRespuestas = (Number(correctas) || 0) + (Number(incorrectas) || 0) + (Number(enBlanco) || 0)
    const errorCantidad = configActual && totalRespuestas > configActual.cantidadPreguntas

    // Función para seleccionar un alumno para calificar (o editar)
    const seleccionarAlumno = (alumno: any) => {
        setEstudianteActivo(alumno)
        setBusqueda("")

        // Si ya tiene nota, pre-cargamos los datos para EDITAR
        if (alumno.resultado) {
            setCorrectas(alumno.resultado.correctas)
            setIncorrectas(alumno.resultado.incorrectas)
            setEnBlanco(alumno.resultado.enBlanco)
            // Formatear fecha para el input datetime-local
            if (alumno.resultado.horaSalida) {
                const d = new Date(alumno.resultado.horaSalida)
                setHoraSalida(d.toISOString().slice(0, 16))
            } else {
                setHoraSalida("")
            }
        } else {
            // Si es nuevo, limpiamos
            setCorrectas("")
            setIncorrectas("")
            setEnBlanco("")
            setHoraSalida("")
        }
    }

    const guardarNota = async () => {
        if (errorCantidad) return alert("La cantidad de respuestas supera el límite de preguntas del examen.")
        if (correctas === "" || incorrectas === "" || enBlanco === "") return alert("Completa todos los campos.")

        setLoading(true)
        try {
            const res = await fetch("/api/resultados", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    estudianteId: estudianteActivo.id,
                    correctas,
                    incorrectas,
                    enBlanco,
                    puntajeTotal,
                    horaSalida: horaSalida ? new Date(horaSalida).toISOString() : null
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error)
            }

            alert("¡Nota guardada/actualizada con éxito!")
            setEstudianteActivo(null)
            router.refresh() // Recargar datos

        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    // Lista de alumnos que YA fueron calificados para fácil acceso a edición
    const alumnosCalificados = estudiantes.filter(e => e.resultado != null).sort((a, b) => b.resultado.createdAt > a.resultado.createdAt ? 1 : -1)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* PANEL IZQUIERDO: Buscador y Calificador */}
            <div className="lg:col-span-2 space-y-6">

                {/* BUSCADOR */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Buscar Alumno por DNI o Nombres</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Ej. 74898556 o Juan Perez"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>

                    {/* Resultados Rápidos */}
                    {busqueda.length >= 2 && (
                        <div className="mt-2 border rounded-lg overflow-hidden bg-white shadow-lg absolute z-10 w-full max-w-2xl">
                            {alumnosFiltrados.length === 0 ? (
                                <div className="p-4 text-gray-500 text-sm text-center">No se encontraron alumnos completos con ese dato.</div>
                            ) : (
                                <ul className="divide-y">
                                    {alumnosFiltrados.map(alumno => (
                                        <li
                                            key={alumno.id}
                                            className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                                            onClick={() => seleccionarAlumno(alumno)}
                                        >
                                            <div>
                                                <p className="font-bold text-gray-800">{alumno.nombres} {alumno.apellidos}</p>
                                                <p className="text-xs text-gray-500">DNI: {alumno.dni} | {alumno.gradoOEdad} {alumno.nivel}</p>
                                            </div>
                                            {alumno.resultado && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">Ya Calificado</span>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                {/* PANEL DE CALIFICACIÓN */}
                {estudianteActivo && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200 animate-in fade-in zoom-in duration-200">
                        <div className="border-b pb-4 mb-4 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{estudianteActivo.nombres} {estudianteActivo.apellidos}</h3>
                                <p className="text-gray-600">DNI: {estudianteActivo.dni} | <span className="font-bold text-blue-600">{estudianteActivo.gradoOEdad} - {estudianteActivo.nivel}</span></p>
                            </div>
                            <button onClick={() => setEstudianteActivo(null)} className="text-gray-400 hover:text-red-500 text-sm font-bold">Cancelar</button>
                        </div>

                        {/* Información de la Regla */}
                        <div className="mb-6 bg-blue-50 p-3 rounded-lg flex items-center justify-between text-sm">
                            <span className="text-blue-800 font-medium">Reglas de Calificación:</span>
                            <div className="flex space-x-4 text-xs font-bold">
                                <span className="text-green-600">Correcta: +{configActual?.puntosCorrecto}</span>
                                <span className="text-red-600">Incorrecta: {configActual?.puntosIncorrecto}</span>
                                <span className="text-gray-500">Blanco: {configActual?.puntosBlanco}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">✅ Correctas</label>
                                <input
                                    type="number" min="0"
                                    className="w-full text-center text-2xl p-3 border border-green-300 rounded-lg focus:ring-green-500 bg-green-50 text-green-700"
                                    value={correctas} onChange={(e) => setCorrectas(e.target.value === "" ? "" : Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">❌ Incorrectas</label>
                                <input
                                    type="number" min="0"
                                    className="w-full text-center text-2xl p-3 border border-red-300 rounded-lg focus:ring-red-500 bg-red-50 text-red-700"
                                    value={incorrectas} onChange={(e) => setIncorrectas(e.target.value === "" ? "" : Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">⚪ En Blanco</label>
                                <input
                                    type="number" min="0"
                                    className="w-full text-center text-2xl p-3 border border-gray-300 rounded-lg focus:ring-gray-500 bg-gray-100 text-gray-700"
                                    value={enBlanco} onChange={(e) => setEnBlanco(e.target.value === "" ? "" : Number(e.target.value))}
                                />
                            </div>
                        </div>

                        {errorCantidad && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 flex items-center rounded-lg text-sm font-bold">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Error: Has ingresado {totalRespuestas} respuestas, pero el examen solo tiene {configActual?.cantidadPreguntas} preguntas.
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row items-center justify-between border-t pt-4 gap-4">
                            <div className="w-full md:w-1/2">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Hora de Salida (Para Desempate)</label>
                                <input
                                    type="datetime-local"
                                    className="w-full p-2 border rounded-lg text-sm"
                                    value={horaSalida} onChange={(e) => setHoraSalida(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center space-x-4 w-full md:w-auto justify-end">
                                <div className="text-right">
                                    <span className="block text-xs text-gray-500 uppercase font-bold">Puntaje Total</span>
                                    <span className="text-3xl font-extrabold text-blue-600">{puntajeTotal}</span>
                                </div>
                                <button
                                    onClick={guardarNota}
                                    disabled={loading || errorCantidad || correctas === "" || incorrectas === "" || enBlanco === ""}
                                    className="bg-blue-600 text-white px-6 py-4 rounded-xl font-bold flex items-center shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                                >
                                    <Save className="w-5 h-5 mr-2" />
                                    {loading ? "Guardando..." : estudianteActivo.resultado ? "Actualizar Nota" : "Guardar Nota"}
                                </button>
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {/* PANEL DERECHO: Últimos Calificados */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
                <div className="p-4 border-b bg-gray-50 rounded-t-xl">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                        Ya Calificados ({alumnosCalificados.length})
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {alumnosCalificados.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center italic mt-10">Ningún alumno calificado aún.</p>
                    ) : (
                        alumnosCalificados.map((alumno) => (
                            <div key={alumno.id} className="p-3 bg-gray-50 rounded-lg border flex justify-between items-center group">
                                <div>
                                    <p className="text-sm font-bold text-gray-800 truncate w-40">{alumno.nombres} {alumno.apellidos}</p>
                                    <p className="text-xs text-gray-500">{alumno.gradoOEdad} - Ptj: <span className="font-bold text-blue-600">{alumno.resultado.puntajeTotal}</span></p>
                                </div>
                                <button
                                    onClick={() => seleccionarAlumno(alumno)}
                                    className="text-gray-400 hover:text-blue-600 p-2"
                                    title="Editar Nota"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    )
}