"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Search, Save, CheckCircle, AlertTriangle, Edit2, Clock } from "lucide-react"
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

    // Referencias para el auto-focus rápido
    const correctasRef = useRef<HTMLInputElement>(null)

    // Estado del formulario de notas
    const [correctas, setCorrectas] = useState<number | "">("")
    const [incorrectas, setIncorrectas] = useState<number | "">("")

    // Estados de Tiempo
    const [hora, setHora] = useState<string>("")
    const [minuto, setMinuto] = useState<string>("")
    const [segundo, setSegundo] = useState<string>("")
    const [ampm, setAmPm] = useState<"AM" | "PM">("AM")

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
            cantidadPreguntas: 20,
            puntosCorrecto: 10,
            puntosIncorrecto: -1,
            puntosBlanco: 0
        }
    }, [estudianteActivo, configuraciones])

    // Cálculo automático de las respuestas En Blanco
    const enBlanco = useMemo(() => {
        if (!configActual) return 0
        const c = Number(correctas) || 0
        const i = Number(incorrectas) || 0
        const totalRespondidas = c + i
        const calculo = configActual.cantidadPreguntas - totalRespondidas
        return calculo > 0 ? calculo : 0
    }, [correctas, incorrectas, configActual])

    // Cálculo automático del puntaje total
    const puntajeTotal = useMemo(() => {
        if (!configActual) return 0
        const c = Number(correctas) || 0
        const i = Number(incorrectas) || 0
        return (c * configActual.puntosCorrecto) + (i * configActual.puntosIncorrecto) + (enBlanco * configActual.puntosBlanco)
    }, [correctas, incorrectas, enBlanco, configActual])

    // Validaciones
    const totalRespuestas = (Number(correctas) || 0) + (Number(incorrectas) || 0)
    const errorCantidad = configActual && totalRespuestas > configActual.cantidadPreguntas

    // Validar hora vacía o ceros (No permite "00:00:00")
    const errorHora = !hora || !minuto || !segundo || (hora === "0" && minuto === "0" && segundo === "0") || (hora === "00" && minuto === "00" && segundo === "00")

    // Función para seleccionar un alumno para calificar (o editar)
    const seleccionarAlumno = (alumno: any) => {
        // Bloquear si el pago es pendiente
        if (alumno.pago?.estado === "PENDIENTE") {
            alert("No se puede calificar a este alumno. Su pago se encuentra PENDIENTE.")
            return
        }

        setEstudianteActivo(alumno)
        setBusqueda("")

        // Si ya tiene nota, pre-cargamos los datos para EDITAR
        if (alumno.resultado) {
            setCorrectas(alumno.resultado.correctas)
            setIncorrectas(alumno.resultado.incorrectas)

            // Extraer hora, minuto, segundo y am/pm a partir del ISO guardado
            if (alumno.resultado.horaSalida) {
                const d = new Date(alumno.resultado.horaSalida)
                let h = d.getHours()
                const m = d.getMinutes()
                const s = d.getSeconds()
                const isPM = h >= 12

                setAmPm(isPM ? "PM" : "AM")
                h = h % 12 || 12 // Convertir a formato 12h (0 se vuelve 12)

                setHora(h.toString().padStart(2, '0'))
                setMinuto(m.toString().padStart(2, '0'))
                setSegundo(s.toString().padStart(2, '0'))
            } else {
                setHora("")
                setMinuto("")
                setSegundo("")
                setAmPm("AM")
            }
        } else {
            // Si es nuevo, limpiamos
            setCorrectas(0) // Empezar en 0 para evitar nulls
            setIncorrectas(0)
            setHora("")
            setMinuto("")
            setSegundo("")
            setAmPm("AM")
        }

        // Dar el foco automáticamente al input de Correctas para escribir al toque
        setTimeout(() => {
            correctasRef.current?.select() // .select() marca el número para sobreescribirlo de inmediato
        }, 100)
    }

    const guardarNota = async (e?: React.FormEvent) => {
        if (e) e.preventDefault() // Prevenir recarga de página por Enter

        if (errorCantidad) return alert("La cantidad de respuestas supera el límite de preguntas.")
        if (correctas === "" || incorrectas === "") return alert("Faltan correctas o incorrectas.")
        if (errorHora) return alert("Debes ingresar una hora, minuto y segundo válidos. No puede ser 00:00:00.")

        setLoading(true)
        try {
            // Construir la fecha exacta de salida usando el día de hoy y la hora dada
            const fechaSalida = new Date()
            let hFinal = parseInt(hora)
            if (ampm === "PM" && hFinal < 12) hFinal += 12
            if (ampm === "AM" && hFinal === 12) hFinal = 0 // Medianoche

            fechaSalida.setHours(hFinal, parseInt(minuto), parseInt(segundo), 0)

            const res = await fetch("/api/resultados", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    estudianteId: estudianteActivo.id,
                    correctas,
                    incorrectas,
                    enBlanco, // Enviamos el calculado
                    puntajeTotal,
                    horaSalida: fechaSalida.toISOString() // Formato UTC seguro
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error)
            }

            // Notificación visual rápida sin interrumpir flujo
            // Opcionalmente podrías usar un toast (Ej. sonner) aquí en vez de alert
            console.log("¡Nota guardada/actualizada con éxito!")
            setEstudianteActivo(null)
            router.refresh() // Recargar datos de la DB

            // Regresamos el foco al buscador para el siguiente alumno
            const searchInput = document.getElementById("buscador-alumnos")
            if (searchInput) searchInput.focus()

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
                            id="buscador-alumnos"
                            type="text"
                            placeholder="Ej. 74898556 o Juan Perez"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            autoComplete="off"
                        />
                    </div>

                    {/* Resultados Rápidos */}
                    {busqueda.length >= 2 && (
                        <div className="mt-2 border rounded-lg overflow-hidden bg-white shadow-lg absolute z-10 w-full max-w-2xl">
                            {alumnosFiltrados.length === 0 ? (
                                <div className="p-4 text-gray-500 text-sm text-center">No se encontraron alumnos completos con ese dato.</div>
                            ) : (
                                <ul className="divide-y">
                                    {alumnosFiltrados.map(alumno => {
                                        const isPendiente = alumno.pago?.estado === "PENDIENTE"
                                        return (
                                            <li
                                                key={alumno.id}
                                                className={`p-3 flex justify-between items-center transition-colors ${isPendiente ? "bg-red-50 opacity-70 cursor-not-allowed" : "hover:bg-blue-50 cursor-pointer"
                                                    }`}
                                                onClick={() => !isPendiente && seleccionarAlumno(alumno)}
                                            >
                                                <div>
                                                    <p className={`font-bold ${isPendiente ? "text-red-800" : "text-gray-800"}`}>
                                                        {alumno.nombres} {alumno.apellidos}
                                                    </p>
                                                    <p className="text-xs text-gray-500">DNI: {alumno.dni} | {alumno.gradoOEdad} {alumno.nivel}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {isPendiente && <span className="bg-red-200 text-red-800 text-xs px-2 py-1 rounded font-bold">Pago Pendiente</span>}
                                                    {alumno.resultado && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold flex items-center"><Edit2 className="w-3 h-3 mr-1" /> Ya Calificado</span>}
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                {/* PANEL DE CALIFICACIÓN */}
                {estudianteActivo && (
                    <form onSubmit={guardarNota} className="bg-white p-6 rounded-xl shadow-sm border border-blue-200 animate-in fade-in zoom-in duration-200">
                        <div className="border-b pb-4 mb-4 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{estudianteActivo.nombres} {estudianteActivo.apellidos}</h3>
                                <p className="text-gray-600">DNI: {estudianteActivo.dni} | <span className="font-bold text-blue-600">{estudianteActivo.gradoOEdad} - {estudianteActivo.nivel}</span></p>
                            </div>
                            <button type="button" onClick={() => setEstudianteActivo(null)} className="text-gray-400 hover:text-red-500 text-sm font-bold">Cancelar</button>
                        </div>

                        {/* Información de la Regla */}
                        <div className="mb-6 bg-blue-50 p-3 rounded-lg flex items-center justify-between text-sm">
                            <span className="text-blue-800 font-medium">Reglas ({configActual?.cantidadPreguntas} Preguntas):</span>
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
                                    ref={correctasRef}
                                    type="number" min="0" max={configActual?.cantidadPreguntas}
                                    className="w-full text-center text-2xl p-3 border border-green-300 rounded-lg focus:ring-green-500 bg-green-50 text-green-700 focus:outline-none focus:ring-2"
                                    value={correctas}
                                    onChange={(e) => setCorrectas(e.target.value === "" ? "" : Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">❌ Incorrectas</label>
                                <input
                                    type="number" min="0" max={configActual?.cantidadPreguntas}
                                    className="w-full text-center text-2xl p-3 border border-red-300 rounded-lg focus:ring-red-500 bg-red-50 text-red-700 focus:outline-none focus:ring-2"
                                    value={incorrectas}
                                    onChange={(e) => setIncorrectas(e.target.value === "" ? "" : Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">⚪ En Blanco (Auto)</label>
                                <input
                                    type="number"
                                    disabled
                                    className="w-full text-center text-2xl p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                                    value={enBlanco}
                                />
                            </div>
                        </div>

                        {errorCantidad && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 flex items-center rounded-lg text-sm font-bold">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Error: Llevas {totalRespuestas} respuestas ingresadas, superando las {configActual?.cantidadPreguntas} disponibles.
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row items-center justify-between border-t pt-4 gap-4">
                            {/* ENTRADA DE HORA RÁPIDA (HH:MM:SS AM/PM) */}
                            <div className="w-full md:w-auto">
                                <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center"><Clock className="w-3 h-3 mr-1" /> Hora de Salida (Requerido)</label>
                                <div className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                                    <input
                                        type="number" placeholder="HH" min="1" max="12"
                                        className="w-14 text-center p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={hora} onChange={(e) => setHora(e.target.value)}
                                    />
                                    <span className="font-bold text-gray-400">:</span>
                                    <input
                                        type="number" placeholder="MM" min="0" max="59"
                                        className="w-14 text-center p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={minuto} onChange={(e) => setMinuto(e.target.value)}
                                    />
                                    <span className="font-bold text-gray-400">:</span>
                                    <input
                                        type="number" placeholder="SS" min="0" max="59"
                                        className="w-14 text-center p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={segundo} onChange={(e) => setSegundo(e.target.value)}
                                    />
                                    <select
                                        className="p-2 border border-gray-300 rounded-md font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                        value={ampm} onChange={(e) => setAmPm(e.target.value as "AM" | "PM")}
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 w-full md:w-auto justify-end">
                                <div className="text-right border-r pr-4 border-gray-200">
                                    <span className="block text-xs text-gray-500 uppercase font-bold">Puntaje Total</span>
                                    <span className={`text-3xl font-extrabold ${errorCantidad ? "text-red-500 line-through" : "text-blue-600"}`}>
                                        {puntajeTotal}
                                    </span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || errorCantidad || correctas === "" || incorrectas === "" || errorHora}
                                    className="bg-blue-600 text-white px-6 py-4 rounded-xl font-bold flex items-center shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                                >
                                    <Save className="w-5 h-5 mr-2" />
                                    {loading ? "Guardando..." : estudianteActivo.resultado ? "Actualizar Nota" : "Guardar Nota"}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>

            {/* PANEL DERECHO: Últimos Calificados */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
                <div className="p-4 border-b bg-gray-50 rounded-t-xl flex justify-between items-center">
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
                                    className="text-gray-400 hover:text-blue-600 p-2 bg-white rounded-md border shadow-sm"
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