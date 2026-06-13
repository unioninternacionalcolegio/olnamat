// app/(dashboard)/admin/premiacion-colegios/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { Trophy, Medal, Award, Loader2, Download, Filter } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const GRADOS_POR_NIVEL = {
    INICIAL: ["3 años", "4 años", "5 años"],
    PRIMARIA: ["1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado"],
    SECUNDARIA: ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"]
};

type RankingItem = {
    colegio: string;
    puntaje: number;
    cantidad: number;
};

type CategoriaData = {
    netos: RankingItem[];
    libres: RankingItem[];
    total: RankingItem[];
};

type PremiacionData = {
    general: CategoriaData;
    porGrado: {
        id: string;
        nivel: string;
        grado: string;
        netos: RankingItem[];
        libres: RankingItem[];
        total: RankingItem[];
    }[];
};

type PivotRow = {
    colegio: string;
    total: number;
    [key: string]: any; // Aquí guardaremos los puntajes dinámicos: "INICIAL|3 años": 120.5
};

export default function PremiacionColegiosPage() {
    const [data, setData] = useState<PremiacionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"netos" | "libres" | "total">("total");

    // Filtros: TODOS, INICIAL, PRIMARIA, SECUNDARIA
    const [vistaActiva, setVistaActiva] = useState<string>("TODOS");

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

    // 1. Determinar qué columnas (grados) vamos a mostrar
    const columnasVisibles = useMemo(() => {
        let cols: { nivel: string; grado: string }[] = [];
        if (vistaActiva === "TODOS") {
            Object.entries(GRADOS_POR_NIVEL).forEach(([nivel, grados]) => {
                grados.forEach(grado => cols.push({ nivel, grado }));
            });
        } else {
            // Es un nivel específico
            const grados = GRADOS_POR_NIVEL[vistaActiva as keyof typeof GRADOS_POR_NIVEL];
            if (grados) {
                grados.forEach(grado => cols.push({ nivel: vistaActiva, grado }));
            }
        }
        return cols;
    }, [vistaActiva]);

    // 2. Construir la data matricial (Pivot Table)
    const pivotData = useMemo(() => {
        if (!data) return [];

        const map = new Map<string, PivotRow>();

        data.porGrado.forEach(gradoItem => {
            // Verificamos si este grado pertenece a la vista actual
            const esVisible = columnasVisibles.some(c => c.nivel === gradoItem.nivel && c.grado === gradoItem.grado);
            if (!esVisible) return;

            const lista = gradoItem[activeTab]; // netos, libres, total

            lista.forEach(est => {
                if (!map.has(est.colegio)) {
                    map.set(est.colegio, { colegio: est.colegio, total: 0 });
                }
                const row = map.get(est.colegio)!;
                const key = `${gradoItem.nivel}|${gradoItem.grado}`;

                row[key] = est.puntaje;
                row.total += est.puntaje; // Sumamos al subtotal/total de la fila
            });
        });

        // Convertimos el mapa a array y ordenamos por el total descendente
        return Array.from(map.values()).sort((a, b) => b.total - a.total);
    }, [data, activeTab, columnasVisibles]);

    // ========================================================
    // GENERACIÓN DE PDF MATRICIAL (LANDSCAPE)
    // ========================================================
    const descargarPDF = () => {
        if (pivotData.length === 0) return alert("No hay datos para exportar.");

        // Usamos formato Horizontal (l) para que entren todas las columnas
        const doc = new jsPDF("l", "pt", "a4");

        // 1. Títulos Centrales
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("CONSOLIDADO DE COLEGIOS (TOP 10 POR GRADO)", doc.internal.pageSize.getWidth() / 2, 40, { align: "center" });

        doc.setFontSize(11);
        doc.setTextColor(100);
        const subtitulo = vistaActiva === "TODOS" ? "TODOS LOS NIVELES" : `NIVEL: ${vistaActiva}`;
        doc.text(subtitulo, doc.internal.pageSize.getWidth() / 2, 58, { align: "center" });

        const modalidadTexto = activeTab === "total" ? "TOTAL COMBINADO" : activeTab === "netos" ? "COLEGIOS NETOS" : "SOLO LIBRES";
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(`Modalidad: ${modalidadTexto}`, doc.internal.pageSize.getWidth() / 2, 72, { align: "center" });

        // 2. Definir Columnas Dinámicas para PDF
        const pdfCols = ["PUESTO", "INSTITUCIÓN", ...columnasVisibles.map(c => `${c.grado}\n(${c.nivel.charAt(0)})`), "TOTAL"];

        // 3. Filas
        const filas = pivotData.map((row, index) => {
            const filaArray = [
                `${index + 1}°`,
                row.colegio,
            ];

            columnasVisibles.forEach(c => {
                const val = row[`${c.nivel}|${c.grado}`];
                filaArray.push(val ? Number(val).toFixed(2) : "-");
            });

            filaArray.push(row.total.toFixed(2));
            return filaArray;
        });

        // ---> CORRECCIÓN: Armamos los estilos de columna dinámicamente <---
        // Esto evita el error de "createdCell" y a TypeScript le encanta.
        const dynamicColumnStyles: Record<number, any> = {
            0: { halign: 'center', fontStyle: 'bold', cellWidth: 40 },
            1: { cellWidth: vistaActiva === "TODOS" ? 140 : 200 }
        };

        // Centrar todas las columnas de notas (desde el índice 2 hasta el penúltimo)
        for (let i = 2; i < pdfCols.length - 1; i++) {
            dynamicColumnStyles[i] = { halign: 'center' };
        }

        // Estilo de la última columna (TOTAL)
        dynamicColumnStyles[pdfCols.length - 1] = { halign: 'right', fontStyle: 'bold', textColor: [22, 163, 74] };

        autoTable(doc, {
            head: [pdfCols],
            body: filas,
            startY: 90,
            styles: { fontSize: vistaActiva === "TODOS" ? 7 : 9, cellPadding: 3 },
            headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', halign: 'center', valign: 'middle' },
            columnStyles: dynamicColumnStyles, // Le pasamos nuestro objeto de estilos limpio
            alternateRowStyles: { fillColor: [249, 250, 251] },
        });

        doc.save(`Matriz_Colegios_${vistaActiva}_${activeTab}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center flex-col gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <p className="text-gray-500 font-medium">Cruzando puntajes del Top 10 por grado...</p>
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

    // Renderizador de la tabla matricial
    const renderTable = () => {
        if (pivotData.length === 0) {
            return (
                <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                    No hay colegios con puntaje en esta categoría para la vista seleccionada.
                </div>
            );
        }

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700 text-xs uppercase border-b border-gray-300">
                                <th className="p-3 font-bold text-center sticky left-0 bg-gray-100 z-10 w-16 shadow-[1px_0_0_0_#d1d5db]">#</th>
                                <th className="p-3 font-bold sticky left-[64px] bg-gray-100 z-10 w-64 shadow-[1px_0_0_0_#d1d5db]">Institución</th>

                                {columnasVisibles.map((col, idx) => (
                                    <th key={idx} className="p-3 font-bold text-center border-l border-gray-200 whitespace-nowrap">
                                        <div className="text-gray-900">{col.grado}</div>
                                        <div className="text-[9px] text-gray-500 mt-0.5">{col.nivel}</div>
                                    </th>
                                ))}

                                <th className="p-3 font-black text-right text-blue-700 border-l border-gray-300 bg-blue-50">
                                    {vistaActiva === "TODOS" ? "TOTAL" : "SUB TOTAL"}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {pivotData.map((row, index) => (
                                <tr
                                    key={index}
                                    className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${index < 3 ? 'bg-yellow-50/10' : 'bg-white'}`}
                                >
                                    <td className="p-3 text-center font-bold text-gray-700 sticky left-0 z-10 bg-inherit shadow-[1px_0_0_0_#f3f4f6]">
                                        {index === 0 ? <Trophy className="w-5 h-5 mx-auto text-yellow-500" /> :
                                            index === 1 ? <Medal className="w-5 h-5 mx-auto text-gray-400" /> :
                                                index === 2 ? <Medal className="w-5 h-5 mx-auto text-amber-600" /> :
                                                    <span className="text-gray-500">{index + 1}°</span>}
                                    </td>
                                    <td className="p-3 font-bold text-gray-800 text-sm sticky left-[64px] z-10 bg-inherit shadow-[1px_0_0_0_#f3f4f6] truncate max-w-[250px]" title={row.colegio}>
                                        {row.colegio}
                                    </td>

                                    {columnasVisibles.map((col, idx) => {
                                        const val = row[`${col.nivel}|${col.grado}`];
                                        return (
                                            <td key={idx} className="p-3 text-center text-sm border-l border-gray-100">
                                                {val ? (
                                                    <span className="font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded">
                                                        {Number(val).toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                        )
                                    })}

                                    <td className="p-3 text-right font-black text-blue-700 border-l border-blue-100 bg-blue-50/30">
                                        {row.total.toFixed(2)}
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
        <div className="p-6 max-w-full mx-auto space-y-6 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <Award className="w-8 h-8 text-blue-600" />
                        Tabla Matriz: Premiación por Colegios
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Suma de puntajes (basada en el Top 10) detallada grado por grado.
                    </p>
                </div>
                {pivotData.length > 0 && (
                    <button onClick={descargarPDF} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center transition-colors shadow-lg shadow-red-600/20 whitespace-nowrap">
                        <Download className="w-5 h-5 mr-2" /> PDF ({vistaActiva === "TODOS" ? "Matriz Completa" : vistaActiva})
                    </button>
                )}
            </div>

            {/* SELECTOR DE VISTA (TODOS VS NIVELES) */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center text-blue-800 font-bold">
                    <Filter className="w-5 h-5 mr-2" />
                    Filtrar Grados Mostrados:
                </div>
                <select
                    value={vistaActiva}
                    onChange={(e) => setVistaActiva(e.target.value)}
                    className="flex-1 p-2.5 border border-blue-200 rounded-lg bg-white font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="TODOS">🌐 MOSTRAR TODOS LOS NIVELES (Tabla Completa)</option>
                    <option value="INICIAL">👶 SOLO INICIAL (3, 4 y 5 años)</option>
                    <option value="PRIMARIA">🎒 SOLO PRIMARIA (1ero a 6to)</option>
                    <option value="SECUNDARIA">🎓 SOLO SECUNDARIA (1ero a 5to)</option>
                </select>
            </div>

            {/* TABS (TIPO DE COLEGIO) */}
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

            {/* TABLA MATRICIAL */}
            <div className="mt-4 animate-in fade-in duration-300">
                {renderTable()}
            </div>
        </div>
    );
}