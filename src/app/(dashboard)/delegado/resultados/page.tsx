"use client"

import { useState, useEffect } from "react"
import { Trophy, Search, Clock, Medal, Info } from "lucide-react"

const OPCIONES_GRADOS = {
    INICIAL: ["3 años", "4 años", "5 años"],
    PRIMARIA: ["1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado"],
    SECUNDARIA: ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"]
}

export default function ResultadosDelegadoPage() {
    const [nivel, setNivel] = useState<keyof typeof OPCIONES_GRADOS>("PRIMARIA")
    const [grado, setGrado] = useState("1er Grado")
    const [resultados, setResultados] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

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
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-2xl shadow-md text-white">
                <div>
                    <h1 className="text-2xl font-black flex items-center">
                        <Trophy className="w-8 h-8 text-yellow-300 mr-3" />
                        Resultados de Mis Alumnos
                    </h1>
                    <p className="text-blue-100 mt-1">Descubre qué puesto ocuparon tus estudiantes inscritos a nivel general.</p>
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
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center transition-colors h-[50px] w-full md:w-auto justify-center shadow-md"
                >
                    <Search className="w-5 h-5 mr-2" /> Ver Mis Alumnos
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500 font-bold animate-pulse">Buscando a tus campeones...</div>
            ) : resultados.length > 0 ? (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-start text-sm">
                        <Info className="w-5 h-5 mr-3 shrink-0 mt-0.5 text-blue-600" />
                        <p>El <strong>Puesto General</strong> mostrado aquí es la posición real que ocupó el alumno compitiendo contra <strong>todos los colegios</strong> de su misma categoría.</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-bold border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-center">Puesto General</th>
                                        <th className="px-6 py-4">Mi Estudiante</th>
                                        <th className="px-6 py-4 text-center text-green-600">Corr</th>
                                        <th className="px-6 py-4 text-center text-red-600">Inco</th>
                                        <th className="px-6 py-4 text-center text-gray-500">Blan</th>
                                        <th className="px-6 py-4 text-center font-black text-blue-600">Puntaje</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {resultados.map((est) => (
                                        <tr key={est.id} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center justify-center bg-gray-900 text-white font-black text-lg w-12 h-12 rounded-xl shadow-md">
                                                    {est.puesto}°
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 text-base">{est.apellidos}, {est.nombres}</div>
                                                <div className="text-xs text-gray-500 font-medium">{est.institucion}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-green-600 text-base">{est.correctas}</td>
                                            <td className="px-6 py-4 text-center font-bold text-red-600 text-base">{est.incorrectas}</td>
                                            <td className="px-6 py-4 text-center font-bold text-gray-400 text-base">{est.enBlanco}</td>
                                            <td className="px-6 py-4 text-center font-black text-2xl text-blue-600">
                                                {est.puntajeTotal}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300">
                    <p className="text-gray-500 font-medium">Aún no hay resultados publicados para tus alumnos en esta categoría o no tienes inscritos aquí.</p>
                </div>
            )}
        </div>
    )
}