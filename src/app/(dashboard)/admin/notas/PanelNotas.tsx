//app/(dashboard)/admin/notas/PanelNotas.tsx
"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Search, Save, CheckCircle, AlertTriangle, Edit2, Clock, Filter, Trophy } from "lucide-react"
import { useRouter } from "next/navigation"

type PanelNotasProps = {
    estudiantes: any[]
    configuraciones: any[]
}

export default function PanelNotas({ estudiantes, configuraciones }: PanelNotasProps) {
    const router = useRouter()

    // Estado local para los estudiantes (permite actualización en vivo al guardar)
    const [localEstudiantes, setLocalEstudiantes] = useState<any[]>(estudiantes)

    // Sincronizar por si hay cambios desde el servidor (cuando se hace router.refresh)
    useEffect(() => {
        setLocalEstudiantes(estudiantes)
    }, [estudiantes])

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

    // Estados para la Tabla Dinámica
    const [filtroNivel, setFiltroNivel] = useState<string>("")
    const [filtroGrado, setFiltroGrado] = useState<string>("")

    // Extraer Niveles y Grados disponibles desde la configuración
    const nivelesDisponibles = useMemo(() => Array.from(new Set(configuraciones.map(c => c.nivel))), [configuraciones])
    const gradosDisponibles = useMemo(() => {
        if (!filtroNivel) return []
        return configuraciones.filter(c => c.nivel === filtroNivel).map(c => c.gradoOEdad)
    }, [filtroNivel, configuraciones])

    // Filtrado de alumnos en el buscador superior (Mantenemos los 5 resultados rápidos)
    const alumnosFiltrados = useMemo(() => {
        if (busqueda.length < 2) return []
        return localEstudiantes.filter(e =>
            e.dni?.includes(busqueda) ||
            `${e.nombres} ${e.apellidos}`.toLowerCase().includes(busqueda.toLowerCase())
        ).slice(0, 5)
    }, [busqueda, localEstudiantes])

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
    const errorHora = !hora || !minuto || !segundo || (hora === "0" && minuto === "0" && segundo === "0") || (hora === "00" && minuto === "00" && segundo === "00")

    const seleccionarAlumno = (alumno: any) => {
        if (alumno.pago?.estado === "PENDIENTE") {
            alert("No se puede calificar a este alumno. Su pago se encuentra PENDIENTE.")
            return
        }

        setEstudianteActivo(alumno)
        setBusqueda("")

        if (alumno.resultado) {
            setCorrectas(alumno.resultado.correctas)
            setIncorrectas(alumno.resultado.incorrectas)

            if (alumno.resultado.horaSalida) {
                const d = new Date(alumno.resultado.horaSalida)
                let h = d.getHours()
                const m = d.getMinutes()
                const s = d.getSeconds()
                const isPM = h >= 12

                setAmPm(isPM ? "PM" : "AM")
                h = h % 12 || 12

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
            setCorrectas(0)
            setIncorrectas(0)
            setHora("")
            setMinuto("")
            setSegundo("")
            setAmPm("AM")
        }

        setTimeout(() => {
            correctasRef.current?.select()
        }, 100)
    }

    const guardarNota = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        if (errorCantidad) return alert("La cantidad de respuestas supera el límite de preguntas.")
        if (correctas === "" || incorrectas === "") return alert("Faltan correctas o incorrectas.")
        if (errorHora) return alert("Debes ingresar una hora, minuto y segundo válidos. No puede ser 00:00:00.")

        setLoading(true)
        try {
            const fechaSalida = new Date()
            let hFinal = parseInt(hora)
            if (ampm === "PM" && hFinal < 12) hFinal += 12
            if (ampm === "AM" && hFinal === 12) hFinal = 0

            fechaSalida.setHours(hFinal, parseInt(minuto), parseInt(segundo), 0)

            const res = await fetch("/api/resultados", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    estudianteId: estudianteActivo.id,
                    correctas,
                    incorrectas,
                    enBlanco,
                    puntajeTotal,
                    horaSalida: fechaSalida.toISOString()
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error)
            }

            // ACTUALIZACIÓN EN VIVO (Mágico): Actualizamos el estado local para que la tabla se reordene al instante
            setLocalEstudiantes(prev => prev.map(est =>
                est.id === estudianteActivo.id
                    ? {
                        ...est,
                        resultado: {
                            correctas,
                            incorrectas,
                            enBlanco,
                            puntajeTotal,
                            horaSalida: fechaSalida.toISOString(),
                            createdAt: new Date().toISOString()
                        }
                    }
                    : est
            ))

            console.log("¡Nota guardada/actualizada con éxito!")
            setEstudianteActivo(null)

            // Llamamos a refresh en background para mantener sincronía con BD
            router.refresh()

            const searchInput = document.getElementById("buscador-alumnos")
            if (searchInput) searchInput.focus()

        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    // LISTA DE CALIFICADOS RÁPIDA (Panel Derecho)
    const alumnosCalificados = localEstudiantes.filter(e => e.resultado != null).sort((a, b) => new Date(b.resultado.createdAt).getTime() - new Date(a.resultado.createdAt).getTime())

    // LA MAGIA DE LA TABLA DINÁMICA: Filtrada y Ordenada
    const tablaDinamicaEstudiantes = useMemo(() => {
        if (!filtroNivel || !filtroGrado) return []

        const filtrados = localEstudiantes.filter(e =>
            e.nivel === filtroNivel &&
            e.gradoOEdad === filtroGrado &&
            e.pago?.estado !== "PENDIENTE" // Solo los que ya pagaron
        )

        return filtrados.sort((a, b) => {
            const resA = a.resultado
            const resB = b.resultado

            if (resA && resB) {
                // 1. Mayor puntaje primero
                if (resB.puntajeTotal !== resA.puntajeTotal) {
                    return resB.puntajeTotal - resA.puntajeTotal
                }
                // 2. Empate: El menor tiempo gana (Ascendente)
                const timeA = new Date(resA.horaSalida).getTime()
                const timeB = new Date(resB.horaSalida).getTime()
                return timeA - timeB
            }
            // Los calificados siempre arriba de los no calificados
            if (resA && !resB) return -1
            if (!resA && resB) return 1

            // Ambos sin calificar: Orden alfabético
            return a.apellidos.localeCompare(b.apellidos)
        })
    }, [localEstudiantes, filtroNivel, filtroGrado])

    // Función para formatear la hora en la tabla
    const formatearHora = (isoString: string) => {
        if (!isoString) return "-"
        const d = new Date(isoString)
        let h = d.getHours()
        const m = d.getMinutes().toString().padStart(2, '0')
        const s = d.getSeconds().toString().padStart(2, '0')
        const esPM = h >= 12
        h = h % 12 || 12
        return `${h}:${m}:${s} ${esPM ? 'PM' : 'AM'}`
    }

    return (
        <div className="space-y-6">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[400px] lg:h-[600px]">
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

            {/* TABLA DINÁMICA DE RANKING EN VIVO */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mt-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        <h2 className="text-lg font-black text-gray-900 uppercase">Ranking en Vivo de Calificación</h2>
                    </div>

                    {/* Filtros para la Tabla */}
                    <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200 w-full md:w-auto">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                            value={filtroNivel}
                            onChange={(e) => { setFiltroNivel(e.target.value); setFiltroGrado(""); }}
                            className="bg-white border border-gray-300 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 p-2 font-bold"
                        >
                            <option value="">-- Nivel --</option>
                            {nivelesDisponibles.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <select
                            value={filtroGrado}
                            onChange={(e) => setFiltroGrado(e.target.value)}
                            disabled={!filtroNivel}
                            className="bg-white border border-gray-300 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 p-2 font-bold disabled:bg-gray-100"
                        >
                            <option value="">-- Grado --</option>
                            {gradosDisponibles.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                </div>

                {!filtroNivel || !filtroGrado ? (
                    <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl font-bold">
                        Selecciona un Nivel y Grado para ver la tabla en vivo.
                    </div>
                ) : (
                    <>
                        <div className="mb-4 text-sm font-bold text-gray-600 flex justify-between">
                            <span>Filtro Actual: <span className="text-blue-600">{filtroNivel} - {filtroGrado}</span></span>
                            <span>Total Inscritos Aptos: <span className="text-blue-600">{tablaDinamicaEstudiantes.length}</span></span>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-600 uppercase bg-gray-100 font-black">
                                    <tr>
                                        <th className="px-4 py-3 text-center">Pos.</th>
                                        <th className="px-4 py-3">Código/DNI</th>
                                        <th className="px-4 py-3 w-1/3">Apellidos y Nombres</th>
                                        <th className="px-4 py-3 text-center text-green-700">Correctas</th>
                                        <th className="px-4 py-3 text-center text-red-700">Incor.</th>
                                        <th className="px-4 py-3 text-center text-gray-500">Blanco</th>
                                        <th className="px-4 py-3 text-center text-blue-700">Puntaje</th>
                                        <th className="px-4 py-3 text-center">Hora Entrega</th>
                                        <th className="px-4 py-3 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tablaDinamicaEstudiantes.map((est, index) => {
                                        const r = est.resultado;
                                        const estaCalificado = !!r;

                                        return (
                                            <tr
                                                key={est.id}
                                                onClick={() => seleccionarAlumno(est)}
                                                className={`border-b transition-colors cursor-pointer hover:bg-blue-50 ${estaCalificado ? "bg-green-50/50" : "bg-gray-50"}`}
                                            >
                                                <td className="px-4 py-3 text-center font-bold text-gray-500">{index + 1}</td>
                                                <td className="px-4 py-3 font-mono font-bold text-gray-600">{est.dni}</td>
                                                <td className="px-4 py-3 font-bold text-gray-800">{est.apellidos}, {est.nombres}</td>
                                                <td className="px-4 py-3 text-center font-bold text-green-600">{estaCalificado ? r.correctas : "-"}</td>
                                                <td className="px-4 py-3 text-center font-bold text-red-600">{estaCalificado ? r.incorrectas : "-"}</td>
                                                <td className="px-4 py-3 text-center font-bold text-gray-500">{estaCalificado ? r.enBlanco : "-"}</td>
                                                <td className="px-4 py-3 text-center font-black text-blue-600 text-base">{estaCalificado ? r.puntajeTotal : "-"}</td>
                                                <td className="px-4 py-3 text-center font-bold text-gray-600">{estaCalificado ? formatearHora(r.horaSalida) : "-"}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {estaCalificado
                                                        ? <span className="bg-green-200 text-green-800 text-[10px] px-2 py-1 rounded font-black uppercase">Calificado</span>
                                                        : <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded font-black uppercase">Pendiente</span>
                                                    }
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {tablaDinamicaEstudiantes.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-8 text-center text-gray-500 font-bold bg-white">
                                                No hay alumnos registrados con pago completado en este Nivel y Grado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}