"use client"

import { useState } from "react"
import { Users, Banknote, GraduationCap, ChevronRight, School, UserCheck, ShieldCheck } from "lucide-react"

export default function DashboardClient({ global, statsNiveles }: any) {
    const [nivelActivo, setNivelActivo] = useState<string | null>(null)

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* CABECERA GLOBAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-black uppercase">Inscritos</p>
                        <h3 className="text-2xl font-black text-gray-900">{global.totalInscritos}</h3>
                    </div>
                </div>

                {global.totalesPorTipo.map((t: any) => (
                    <div key={t.tipo} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                        <div className={`p-4 rounded-2xl ${t.tipo === 'ESTATAL' ? 'bg-orange-50 text-orange-600' :
                            t.tipo === 'PARTICULAR' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                            <Banknote className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase">Recaudado {t.tipo}</p>
                            <h3 className="text-xl font-black text-gray-900">S/ {t.monto.toFixed(2)}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* SECCIÓN DE NIVELES */}
            <h2 className="text-xl font-black text-gray-800 px-2">Estadísticas por Nivel</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statsNiveles.map((nivel: any) => (
                    <button
                        key={nivel.id}
                        onClick={() => setNivelActivo(nivelActivo === nivel.id ? null : nivel.id)}
                        className={`text-left p-8 rounded-[2.5rem] transition-all duration-300 border-2 ${nivelActivo === nivel.id
                            ? 'bg-gray-900 border-gray-900 text-white shadow-2xl scale-[1.02]'
                            : 'bg-white border-transparent hover:border-gray-200 shadow-sm text-gray-900'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <GraduationCap className={`w-10 h-10 ${nivelActivo === nivel.id ? 'text-blue-400' : 'text-blue-600'}`} />
                            <ChevronRight className={`w-6 h-6 transition-transform ${nivelActivo === nivel.id ? 'rotate-90' : ''}`} />
                        </div>
                        <h3 className="text-2xl font-black mb-2">{nivel.id}</h3>
                        <p className={nivelActivo === nivel.id ? 'text-gray-400' : 'text-gray-500 font-bold'}>
                            S/ {nivel.recaudado.toFixed(2)} Total
                        </p>
                    </button>
                ))}
            </div>

            {/* DETALLE POR GRADOS Y TIPOS */}
            {nivelActivo && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 p-6 border-b flex justify-between items-center">
                            <h3 className="font-black text-xl text-gray-800 uppercase">
                                Detalle {nivelActivo}
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-gray-400 text-left uppercase text-[10px] font-black border-b">
                                        <th className="px-8 py-5">Grado / Edad</th>
                                        <th className="px-6 py-5 text-center text-orange-600">Estatal</th>
                                        <th className="px-6 py-5 text-center text-purple-600">Particular</th>
                                        <th className="px-6 py-5 text-center text-emerald-600">Libre</th>
                                        <th className="px-6 py-5 text-right pr-8 text-gray-900">Total Grado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {statsNiveles.find((n: any) => n.id === nivelActivo)?.grados.map((grado: any) => (
                                        <tr key={grado.nombre} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-8 py-6 font-black text-gray-800 text-base">
                                                {grado.nombre}
                                                <div className="text-[10px] font-normal text-gray-400">{grado.aprobados} alumnos aprobados</div>
                                            </td>
                                            {/* Desglose Estatal */}
                                            <td className="px-6 py-6 text-center">
                                                <div className="font-bold text-gray-900">S/ {grado.desglose.find((d: any) => d.tipo === 'ESTATAL').monto.toFixed(2)}</div>
                                                <div className="text-[10px] text-gray-400">{grado.desglose.find((d: any) => d.tipo === 'ESTATAL').cantidad} alumnos</div>
                                            </td>
                                            {/* Desglose Particular */}
                                            <td className="px-6 py-6 text-center">
                                                <div className="font-bold text-gray-900">S/ {grado.desglose.find((d: any) => d.tipo === 'PARTICULAR').monto.toFixed(2)}</div>
                                                <div className="text-[10px] text-gray-400">{grado.desglose.find((d: any) => d.tipo === 'PARTICULAR').cantidad} alumnos</div>
                                            </td>
                                            {/* Desglose Libre */}
                                            <td className="px-6 py-6 text-center">
                                                <div className="font-bold text-gray-900">S/ {grado.desglose.find((d: any) => d.tipo === 'LIBRE').monto.toFixed(2)}</div>
                                                <div className="text-[10px] text-gray-400">{grado.desglose.find((d: any) => d.tipo === 'LIBRE').cantidad} alumnos</div>
                                            </td>
                                            <td className="px-6 py-6 text-right pr-8 font-black text-blue-600 text-lg">
                                                S/ {grado.recaudado.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}