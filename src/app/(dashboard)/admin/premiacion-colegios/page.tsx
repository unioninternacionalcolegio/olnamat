"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Users, Award, Loader2 } from "lucide-react";

type RankingItem = {
    colegio: string;
    puntaje: number;
    cantidad: number;
};

type PremiacionData = {
    netos: RankingItem[];
    libres: RankingItem[];
    total: RankingItem[];
};

export default function PremiacionColegiosPage() {
    const [data, setData] = useState<PremiacionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"netos" | "libres" | "total">("total");

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const res = await fetch("/api/resultados/premiacion-colegios");
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                }
            } catch (error) {
                console.error("Error al cargar la premiación", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRanking();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center flex-col gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <p className="text-gray-500 font-medium">Calculando sumatorias del Top 10 por grado...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6 text-center text-red-500">
                Error al cargar los datos. Inténtalo nuevamente.
            </div>
        );
    }

    // Helper para renderizar la tabla dependiendo del tab activo
    const renderTable = (lista: RankingItem[]) => {
        if (lista.length === 0) {
            return (
                <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                    No hay datos suficientes para mostrar esta categoría.
                </div>
            );
        }

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-700 text-sm border-b border-gray-200">
                                <th className="p-4 font-semibold w-24 text-center">Puesto</th>
                                <th className="p-4 font-semibold">Institución</th>
                                <th className="p-4 font-semibold text-center">Alumnos en Top 10</th>
                                <th className="p-4 font-semibold text-right">Puntaje Acumulado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lista.map((item, index) => (
                                <tr
                                    key={index}
                                    className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${index < 3 ? 'bg-yellow-50/30' : ''}`}
                                >
                                    <td className="p-4 text-center font-bold text-gray-700">
                                        {index === 0 && <Trophy className="w-6 h-6 mx-auto text-yellow-500" />}
                                        {index === 1 && <Medal className="w-6 h-6 mx-auto text-gray-400" />}
                                        {index === 2 && <Medal className="w-6 h-6 mx-auto text-amber-600" />}
                                        {index > 2 && <span className="text-gray-500">{index + 1}</span>}
                                    </td>
                                    <td className="p-4 font-medium text-gray-800">{item.colegio}</td>
                                    <td className="p-4 text-center text-gray-600">
                                        <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-sm font-medium">
                                            <Users className="w-4 h-4 text-gray-500" />
                                            {item.cantidad}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="font-bold text-lg text-blue-700">
                                            {item.puntaje.toFixed(2)} pts
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Award className="w-7 h-7 text-blue-600" />
                        Premiación por Colegios
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Suma de puntajes basada estrictamente en los 10 primeros puestos de cada grado.
                    </p>
                </div>
            </div>

            {/* TABS */}
            <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-fit">
                <button
                    onClick={() => setActiveTab("total")}
                    className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === "total"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                        }`}
                >
                    Total Combinado
                </button>
                <button
                    onClick={() => setActiveTab("netos")}
                    className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === "netos"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                        }`}
                >
                    Colegios Netos
                </button>
                <button
                    onClick={() => setActiveTab("libres")}
                    className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === "libres"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                        }`}
                >
                    Solo Libres
                </button>
            </div>

            {/* CONTENIDO DEL TAB */}
            <div className="mt-4">
                {activeTab === "total" && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                            <h3 className="text-blue-800 font-medium">Vista Consolidada</h3>
                            <p className="text-sm text-blue-600 mt-1">
                                Suma a los alumnos libres y netos de una misma institución (Ej. ZARATE + LIBRE-ZARATE).
                            </p>
                        </div>
                        {renderTable(data.total)}
                    </div>
                )}

                {activeTab === "netos" && (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg">
                            <h3 className="text-emerald-800 font-medium">Colegios Institucionales</h3>
                            <p className="text-sm text-emerald-600 mt-1">
                                Participantes oficiales inscritos bajo el nombre de su institución sin el prefijo LIBRE.
                            </p>
                        </div>
                        {renderTable(data.netos)}
                    </div>
                )}

                {activeTab === "libres" && (
                    <div className="space-y-4">
                        <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg">
                            <h3 className="text-purple-800 font-medium">Participantes Libres</h3>
                            <p className="text-sm text-purple-600 mt-1">
                                Alumnos que participaron de forma independiente, identificados con el prefijo LIBRE-.
                            </p>
                        </div>
                        {renderTable(data.libres)}
                    </div>
                )}
            </div>
        </div>
    );
}