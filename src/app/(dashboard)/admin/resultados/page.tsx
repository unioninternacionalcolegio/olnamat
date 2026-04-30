"use client"

import { useState, useEffect } from "react"
import { Trophy, Search, Clock, Medal } from "lucide-react"

const OPCIONES_GRADOS = {
    INICIAL: ["3 años", "4 años", "5 años"],
    PRIMARIA: ["1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado"],
    SECUNDARIA: ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"]
}

export default function ResultadosAdminPage() {
    const [nivel, setNivel] = useState<keyof typeof OPCIONES_GRADOS>("PRIMARIA")
    const [grado, setGrado] = useState("1er Grado")
    const [resultados, setResultados] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Cuando cambia el nivel, reseteamos el grado al primero de esa lista
    useEffect(() => {
        setGrado(OPCIONES_GRADOS[nivel][0])
    }, [nivel])

    const fetchResultados = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/resultados?nivel=${nivel}&grado=${grado}`)
            const data = await res.json()
            if (res.ok) setResultados(data)
            else alert(data.error)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center">
                        <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
                        Resultados Oficiales Generales
                    </h1>
                    <p className="text-gray-500 mt-1">Ranking de todos los colegios y delegados.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nivel</label>
                    <select value={nivel} onChange={(e) => setNivel(e.target.value as any)} className="w-full p-3 border rounded-xl bg-gray-50">
                        <option value="INICIAL">INICIAL</option>
                        <option value="PRIMARIA">PRIMARIA</option>
                        <option value="SECUNDARIA">SECUNDARIA</option>
                    </select>
                </div>
                <div className="flex-1 w-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Grado o Edad</label>
                    <select value={grado} onChange={(e) => setGrado(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50">
                        {OPCIONES_GRADOS[nivel].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <button
                    onClick={fetchResultados}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center transition-colors h-[50px] w-full md:w-auto justify-center"
                >
                    <Search className="w-5 h-5 mr-2" /> Buscar
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500 font-bold animate-pulse">Calculando ranking oficial...</div>
            ) : resultados.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-800 text-white text-xs uppercase font-bold">
                                <tr>
                                    <th className="px-6 py-4 text-center">Puesto</th>
                                    <th className="px-6 py-4">Estudiante</th>
                                    <th className="px-6 py-4">Institución</th>
                                    <th className="px-6 py-4 text-center text-green-400">Corr</th>
                                    <th className="px-6 py-4 text-center text-red-400">Inco</th>
                                    <th className="px-6 py-4 text-center text-gray-400">Blan</th>
                                    <th className="px-6 py-4 text-center">Hora Entrega</th>
                                    <th className="px-6 py-4 text-center text-yellow-400 text-lg">Puntaje</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {resultados.map((est) => (
                                    <tr key={est.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-center font-black text-lg">
                                            {est.puesto === 1 ? <Medal className="w-6 h-6 text-yellow-500 mx-auto" /> :
                                                est.puesto === 2 ? <Medal className="w-6 h-6 text-gray-400 mx-auto" /> :
                                                    est.puesto === 3 ? <Medal className="w-6 h-6 text-amber-600 mx-auto" /> :
                                                        <span className="text-gray-500">{est.puesto}°</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{est.apellidos}, {est.nombres}</div>
                                            <div className="text-xs text-gray-500">DNI: {est.dni || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-800">{est.institucion}</div>
                                            <div className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded inline-block mt-1">{est.tipoColegio}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-green-600">{est.correctas}</td>
                                        <td className="px-6 py-4 text-center font-bold text-red-600">{est.incorrectas}</td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-400">{est.enBlanco}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center text-gray-500 text-xs">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {est.horaSalida ? new Date(est.horaSalida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-black text-xl text-blue-600 bg-blue-50/50">
                                            {est.puntajeTotal}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300">
                    <p className="text-gray-500">Selecciona un nivel y grado para ver los resultados.</p>
                </div>
            )}
        </div>
    )
}