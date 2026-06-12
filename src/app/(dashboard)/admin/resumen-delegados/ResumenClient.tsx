"use client"

import { useState, useMemo } from "react"
import { Search, ArrowDownAZ, ArrowUpZA, Users } from "lucide-react"

// Estructura de los datos que recibimos del page.tsx
type DelegadoResumen = {
    id: string
    dni: string
    nombre: string
    colegio: string
    totalInscritos: number
    conteoGrados: Record<string, number>
}

// Arrays fijos para armar las columnas en orden
const GRADOS_INICIAL = ["3 años", "4 años", "5 años"]
const GRADOS_PRIMARIA = ["1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado"]
const GRADOS_SECUNDARIA = ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"]

export default function ResumenClient({ delegadosIniciales }: { delegadosIniciales: DelegadoResumen[] }) {
    const [busqueda, setBusqueda] = useState("")
    const [ordenFiltro, setOrdenFiltro] = useState<"MAS_INSCRITOS" | "MENOS_INSCRITOS" | "ALFABETICO">("MAS_INSCRITOS")

    // Lógica para Filtrar y Ordenar en tiempo real
    const delegadosFiltrados = useMemo(() => {
        // 1. Filtrar por búsqueda (Nombre o Colegio)
        let filtrados = delegadosIniciales.filter(d => 
            d.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
            d.colegio.toLowerCase().includes(busqueda.toLowerCase()) ||
            d.dni.includes(busqueda)
        )

        // 2. Ordenar según el botón seleccionado
        filtrados.sort((a, b) => {
            if (ordenFiltro === "MAS_INSCRITOS") return b.totalInscritos - a.totalInscritos
            if (ordenFiltro === "MENOS_INSCRITOS") return a.totalInscritos - b.totalInscritos
            // ALFABETICO
            return a.nombre.localeCompare(b.nombre)
        })

        return filtrados
    }, [delegadosIniciales, busqueda, ordenFiltro])

    // CORRECCIÓN: Agregamos el parámetro 'keyName' para dárselo al <td>
    const renderCelda = (cantidad: number | undefined, keyName: string) => {
        const val = cantidad || 0
        return (
            <td key={keyName} className={`p-2 border border-gray-200 text-center text-xs font-black ${val > 0 ? 'text-blue-600 bg-blue-50/30' : 'text-gray-300'}`}>
                {val > 0 ? val : '-'}
            </td>
        )
    }

    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 space-y-6">
            
            {/* BARRA DE HERRAMIENTAS (Buscador y Filtros) */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                
                {/* Buscador */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar delegado, colegio o DNI..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-12 p-3 rounded-xl border border-gray-300 font-bold focus:outline-none focus:border-blue-500 bg-white"
                    />
                </div>

                {/* Botones de Orden */}
                <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-full md:w-auto overflow-hidden">
                    <button 
                        onClick={() => setOrdenFiltro("MAS_INSCRITOS")}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${ordenFiltro === "MAS_INSCRITOS" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                        <ArrowDownAZ className="w-4 h-4" /> Más Inscritos
                    </button>
                    <button 
                        onClick={() => setOrdenFiltro("MENOS_INSCRITOS")}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${ordenFiltro === "MENOS_INSCRITOS" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                        <ArrowUpZA className="w-4 h-4" /> Menos Inscritos
                    </button>
                </div>

            </div>

            {/* TABLA GIGANTE CON SCROLL HORIZONTAL */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-inner">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                        {/* PRIMERA FILA DE ENCABEZADOS (Agrupaciones por nivel) */}
                        <tr className="bg-gray-800 text-white text-[10px] uppercase font-black text-center">
                            <th rowSpan={2} className="p-3 border border-gray-700 bg-gray-900 w-24">DNI / Código</th>
                            <th rowSpan={2} className="p-3 border border-gray-700 bg-gray-900 w-64 text-left">Delegado</th>
                            <th rowSpan={2} className="p-3 border border-gray-700 bg-gray-900 w-56 text-left">Colegio</th>
                            
                            <th colSpan={3} className="p-2 border border-gray-700 bg-yellow-600">INICIAL</th>
                            <th colSpan={6} className="p-2 border border-gray-700 bg-red-600">PRIMARIA</th>
                            <th colSpan={5} className="p-2 border border-gray-700 bg-blue-600">SECUNDARIA</th>
                            
                            <th rowSpan={2} className="p-3 border border-gray-700 bg-green-600 text-sm">TOTAL</th>
                        </tr>
                        {/* SEGUNDA FILA DE ENCABEZADOS (Grados específicos) */}
                        <tr className="bg-gray-100 text-gray-600 text-[9px] uppercase font-black text-center">
                            {/* Inicial */}
                            {GRADOS_INICIAL.map(g => <th key={g} className="p-2 border border-gray-300 w-12">{g.replace(" años", "A")}</th>)}
                            {/* Primaria */}
                            {GRADOS_PRIMARIA.map(g => <th key={g} className="p-2 border border-gray-300 w-12">{g.replace(" Grado", "G")}</th>)}
                            {/* Secundaria */}
                            {GRADOS_SECUNDARIA.map(g => <th key={g} className="p-2 border border-gray-300 w-12">{g.replace(" Año", "A")}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {delegadosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan={18} className="p-10 text-center font-bold text-gray-400">
                                    No se encontraron delegados con esos criterios.
                                </td>
                            </tr>
                        ) : (
                            delegadosFiltrados.map((d, index) => (
                                <tr key={d.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                    <td className="p-3 border border-gray-200 text-xs font-bold text-gray-600 text-center">{d.dni}</td>
                                    <td className="p-3 border border-gray-200 text-xs font-black text-gray-800">{d.nombre}</td>
                                    <td className="p-3 border border-gray-200 text-[10px] font-bold text-gray-500 uppercase">{d.colegio}</td>
                                    
                                    {/* CORRECCIÓN: Ahora le pasamos la 'g' (el nombre del grado) como segundo parámetro */}
                                    {GRADOS_INICIAL.map(g => renderCelda(d.conteoGrados[g], g))}
                                    
                                    {/* Columnas Primaria */}
                                    {GRADOS_PRIMARIA.map(g => renderCelda(d.conteoGrados[g], g))}
                                    
                                    {/* Columnas Secundaria */}
                                    {GRADOS_SECUNDARIA.map(g => renderCelda(d.conteoGrados[g], g))}

                                    {/* Total General */}
                                    <td className="p-3 border border-gray-200 text-sm font-black text-green-600 text-center bg-green-50/50">
                                        <div className="flex items-center justify-center gap-1">
                                            <Users className="w-4 h-4" /> {d.totalInscritos}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="text-right text-xs font-bold text-gray-400">
                Total de delegados listados: {delegadosFiltrados.length}
            </div>
        </div>
    )
}