"use client"

import { useState, useEffect } from "react"
import { Trophy, Search, User, Info } from "lucide-react"

const OPCIONES_GRADOS = {
    INICIAL: ["3 años", "4 años", "5 años"],
    PRIMARIA: ["1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado"],
    SECUNDARIA: ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"]
}

export default function ResultadosLibrePage() {
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
            <div className="flex items-center justify-between p-6 rounded-2xl shadow-md text-white bg-gradient-to-r from-emerald-600 to-emerald-800">
                <div>
                    <h1 className="text-2xl font-black flex items-center">
                        <Trophy className="w-8 h-8 text-yellow-300 mr-3" />
                        Mis Resultados Oficiales
                    </h1>
                    <p className="mt-1 text-emerald-100">
                        Descubre en qué puesto quedaste a nivel general en el concurso.
                    </p>
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
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold flex items-center transition-colors h-[50px] w-full md:w-auto justify-center shadow-md"
                >
                    <Search className="w-5 h-5 mr-2" /> Ver Mi Resultado
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500 font-bold animate-pulse">Buscando tu examen en la base de datos...</div>
            ) : resultados.length > 0 ? (
                <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start text-sm">
                        <Info className="w-5 h-5 mr-3 shrink-0 mt-0.5 text-emerald-600" />
                        <p>El <strong>Puesto General</strong> mostrado aquí es tu posición real obtenida compitiendo contra <strong>todos los participantes</strong> de tu categoría.</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-bold border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-center">Puesto General</th>
                                        <th className="px-6 py-4">Participante</th>
                                        <th className="px-6 py-4 text-center text-green-600">Corr</th>
                                        <th className="px-6 py-4 text-center text-red-600">Inco</th>
                                        <th className="px-6 py-4 text-center text-gray-500">Blan</th>
                                        <th className="px-6 py-4 text-center font-black text-emerald-600">Puntaje</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {resultados.map((est) => (
                                        <tr key={est.id} className="hover:bg-emerald-50/50 transition-colors">
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center justify-center bg-gray-900 text-white font-black text-lg w-12 h-12 rounded-xl shadow-md">
                                                    {est.puesto}°
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 text-base flex items-center">
                                                    <User className="w-4 h-4 mr-2 text-gray-400" />
                                                    {est.apellidos}, {est.nombres}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium mt-1">Colegio: {est.institucion}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-green-600 text-base">{est.correctas}</td>
                                            <td className="px-6 py-4 text-center font-bold text-red-600 text-base">{est.incorrectas}</td>
                                            <td className="px-6 py-4 text-center font-bold text-gray-400 text-base">{est.enBlanco}</td>
                                            <td className="px-6 py-4 text-center font-black text-2xl text-emerald-600">
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
                    <p className="text-gray-500 font-medium">Aún no hay resultados publicados para tu grado o no estás inscrito en esta categoría.</p>
                </div>
            )}
        </div>
    )
}