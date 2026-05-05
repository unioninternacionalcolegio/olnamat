"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Printer, Settings, CheckCircle, AlertCircle, X, BookOpen } from "lucide-react"

// AQUÍ EXPORTAMOS EL TIPO PARA QUE EL PAGE.TSX NO DE ERROR
export type ConfiguracionDashboard = {
    id: string
    nivel: string
    gradoOEdad: string
    cantidadPreguntas: number
    clavesRespuestas: any
    cantidadEstudiantes: number
}

export default function DashboardPruebasClient({
    configuraciones
}: {
    configuraciones: ConfiguracionDashboard[]
}) {
    const router = useRouter()
    const [modalOpen, setModalOpen] = useState(false)
    const [configSeleccionada, setConfigSeleccionada] = useState<ConfiguracionDashboard | null>(null)
    const [respuestas, setRespuestas] = useState<string[]>([])
    const [guardando, setGuardando] = useState(false)

    const abrirModal = (config: ConfiguracionDashboard) => {
        setConfigSeleccionada(config)
        // Si ya hay respuestas guardadas, las cargamos. Si no, llenamos de 'A'
        if (config.clavesRespuestas && Array.isArray(config.clavesRespuestas) && config.clavesRespuestas.length > 0) {
            setRespuestas(config.clavesRespuestas)
        } else {
            setRespuestas(Array(config.cantidadPreguntas).fill('A'))
        }
        setModalOpen(true)
    }

    const handleCambiarRespuesta = (index: number, valor: string) => {
        const nuevasRespuestas = [...respuestas]
        nuevasRespuestas[index] = valor
        setRespuestas(nuevasRespuestas)
    }

    const guardarSolucionario = async () => {
        if (!configSeleccionada) return
        setGuardando(true)
        try {
            const res = await fetch("/api/configuracion/solucionario", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: configSeleccionada.id,
                    clavesRespuestas: respuestas
                })
            })
            if (res.ok) {
                alert("Solucionario guardado con éxito")
                setModalOpen(false)
                router.refresh() // Recargamos para actualizar el check verde
            } else {
                alert("Error al guardar el solucionario")
            }
        } catch (error) {
            alert("Error de conexión")
        } finally {
            setGuardando(false)
        }
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {configuraciones.map((config) => {
                    const tieneSolucionario = config.clavesRespuestas && Array.isArray(config.clavesRespuestas) && config.clavesRespuestas.length > 0;

                    return (
                        <div key={config.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                            <div className="bg-slate-50 border-b p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-xs font-bold text-blue-600 uppercase bg-blue-100 px-2 py-1 rounded-full">
                                            {config.nivel}
                                        </span>
                                        <h3 className="text-xl font-black text-gray-800 mt-2">{config.gradoOEdad}</h3>
                                    </div>
                                    <BookOpen className="text-gray-300 w-8 h-8" />
                                </div>
                            </div>

                            <div className="p-4 flex-1 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Estudiantes inscritos:</span>
                                    <span className="font-bold text-lg bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                                        {config.cantidadEstudiantes}
                                    </span>
                                </div>

                                <div className="flex items-center text-sm p-2 rounded-lg bg-gray-50 border">
                                    {tieneSolucionario ? (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                            <span className="text-green-700 font-medium">Solucionario listo</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
                                            <span className="text-amber-700 font-medium">Falta solucionario</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t flex flex-col gap-3">
                                <button
                                    onClick={() => abrirModal(config)}
                                    className="w-full bg-white border-2 border-gray-300 hover:border-gray-800 text-gray-700 font-bold py-2 rounded-lg flex items-center justify-center transition-colors"
                                >
                                    <Settings className="w-5 h-5 mr-2" /> Configurar Claves
                                </button>

                                <Link
                                    href={`/admin/imprimir-fichas?nivel=${encodeURIComponent(config.nivel)}&grado=${encodeURIComponent(config.gradoOEdad)}`}
                                    className={`w-full font-bold py-2 rounded-lg flex items-center justify-center transition-colors ${config.cantidadEstudiantes > 0
                                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                                        : "bg-gray-200 text-gray-400 pointer-events-none"
                                        }`}
                                >
                                    <Printer className="w-5 h-5 mr-2" /> Imprimir Fichas
                                </Link>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* MODAL SOLUCIONARIO */}
            {modalOpen && configSeleccionada && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">

                        <div className="flex justify-between items-center p-6 border-b">
                            <div>
                                <h2 className="text-2xl font-black text-gray-800">Solucionario</h2>
                                <p className="text-gray-500 font-medium">{configSeleccionada.gradoOEdad} - {configSeleccionada.nivel}</p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="hover:bg-gray-100 p-2 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {respuestas.map((resp, index) => (
                                    <div key={index} className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col items-center shadow-sm">
                                        <span className="text-xs font-bold text-gray-400 mb-2">Pregunta {index + 1}</span>
                                        <select
                                            value={resp}
                                            onChange={(e) => handleCambiarRespuesta(index, e.target.value)}
                                            className="font-black text-xl bg-gray-100 hover:bg-gray-200 text-gray-800 cursor-pointer rounded-lg px-4 py-2 outline-none w-full text-center appearance-none transition-colors border border-transparent focus:border-blue-500"
                                        >
                                            {['A', 'B', 'C', 'D', 'E'].map(l => (
                                                <option key={l} value={l}>{l}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 border-t flex justify-end gap-4 bg-white rounded-b-2xl">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-6 py-2 font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardarSolucionario}
                                disabled={guardando}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-colors disabled:opacity-50 flex items-center"
                            >
                                {guardando ? "Guardando..." : "Guardar Solucionario"}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}