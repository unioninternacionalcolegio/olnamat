// app/(dashboard)/admin/imprimir-fichas/VistaImpresionFichas.tsx
"use client"

import { Printer, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import QRCode from "react-qr-code"

interface Configuracion {
    id: string
    nivel: string
    gradoOEdad: string
    cantidadPreguntas: number
}

export default function VistaImpresionFichas({
    configuracion
}: {
    configuracion: Configuracion
}) {
    const router = useRouter()

    const handlePrint = () => {
        window.print()
    }

    if (!configuracion) {
        return (
            <div className="p-6 text-center text-red-500 font-bold">
                No hay configuración de concurso.
            </div>
        )
    }

    const qrData = JSON.stringify({ c: configuracion.id })

    // ==========================================
    // BALANCEO INTELIGENTE DE COLUMNAS
    // ==========================================
    const totalPreguntas = configuracion.cantidadPreguntas;
    // Si son más de 40 preguntas, forzamos 3 columnas. Si no, 2 columnas.
    const numCols = totalPreguntas > 40 ? 3 : 2;
    const preguntasPorColumna = Math.ceil(totalPreguntas / numCols);

    const columnasPreguntas = Array.from({ length: numCols }).map((_, colIndex) => {
        const start = colIndex * preguntasPorColumna;
        const end = Math.min(start + preguntasPorColumna, totalPreguntas);
        return Array.from({ length: end - start }).map((_, i) => start + i);
    }).filter(col => col.length > 0); // Limpiamos columnas vacías por si acaso

    return (
        <div className="min-h-screen bg-gray-100 p-4 font-sans">
            {/* CONTROLES */}
            <div className="print:hidden bg-white p-4 rounded-xl shadow-sm border mb-6 flex justify-between items-center sticky top-4 z-10 max-w-5xl mx-auto">
                <div className="flex items-center space-x-4">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 flex items-center">
                        <ArrowLeft className="w-5 h-5 mr-1" /> Volver
                    </button>
                    <div>
                        <h2 className="font-bold text-gray-800">Plantilla Maestra OMR (Smart MAX)</h2>
                        <p className="text-xs text-gray-500">
                            {configuracion.gradoOEdad} | {totalPreguntas} Preguntas en {numCols} Columnas
                        </p>
                    </div>
                </div>

                <button
                    onClick={handlePrint}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center shadow-md transition-colors"
                >
                    <Printer className="w-5 h-5 mr-2" /> Imprimir A4
                </button>
            </div>

            {/* ÁREA DE IMPRESIÓN - HOJA A4 EXACTA */}
            <div id="print-area" className="flex flex-col items-center">
                <div className="bg-white relative mx-auto overflow-hidden shadow-lg" style={{ width: "210mm", height: "297mm" }}>

                    {/* FIDUCIALES GLOBALES DE LAS ESQUINAS (Para enderezar) */}
                    <div className="absolute top-[10mm] left-[10mm] w-[12mm] h-[12mm] bg-black"></div>
                    <div className="absolute top-[10mm] right-[10mm] w-[12mm] h-[12mm] bg-black"></div>
                    <div className="absolute bottom-[10mm] left-[10mm] w-[12mm] h-[12mm] bg-black"></div>
                    <div className="absolute bottom-[10mm] right-[10mm] w-[12mm] h-[12mm] bg-black"></div>

                    <div className="px-[25mm] py-[25mm] h-full flex flex-col">

                        {/* CABECERA */}
                        <div className="flex justify-between items-center border-b-4 border-black pb-3 mb-3">
                            <div className="flex-1">
                                <h1 className="text-2xl font-black uppercase tracking-tight mb-1">
                                    HOJA DE RESPUESTAS OFICIAL
                                </h1>
                                <div className="text-sm font-bold uppercase bg-gray-200 inline-block px-3 py-1 border-2 border-black">
                                    {configuracion.gradoOEdad} - {configuracion.nivel}
                                </div>
                            </div>
                            <div className="flex flex-col items-center border-4 border-black p-1 ml-4 bg-white relative">
                                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-black"></div>
                                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-black"></div>
                                <QRCode value={qrData} size={70} level="H" />
                                <span className="text-[8px] font-mono mt-1 font-bold">C-{configuracion.id.slice(-5)}</span>
                            </div>
                        </div>

                        {/* DATOS ESCRITOS */}
                        <div className="flex gap-4 mb-4">
                            <div className="flex-1 border-2 border-black h-10 flex flex-col justify-end p-1">
                                <span className="text-[10px] font-bold text-gray-700">APELLIDOS Y NOMBRES:</span>
                            </div>
                            <div className="w-1/3 border-2 border-black h-10 flex flex-col justify-end p-1">
                                <span className="text-[10px] font-bold text-gray-700">I.E. PROCEDENCIA:</span>
                            </div>
                        </div>

                        {/* ZONA INTELIGENTE 1: DNI Y HORA */}
                        <div className="flex gap-6 mb-4 justify-center">

                            {/* BLOQUE DNI */}
                            <div className="relative border-4 border-black p-2 bg-white">
                                {/* ANCLAS PERFECTAS */}
                                <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-black"></div>
                                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black"></div>
                                <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-black"></div>
                                <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-black"></div>

                                <h3 className="text-[11px] font-black mb-1 text-center tracking-widest">MARQUE DNI</h3>
                                <div className="flex gap-1">
                                    {Array.from({ length: 8 }).map((_, col) => (
                                        <div key={`dni-${col}`} className="flex flex-col gap-0.5 border-r border-gray-300 last:border-0 pr-1 pl-1">
                                            <div className="w-4 h-5 border-2 border-black mb-1"></div>
                                            {Array.from({ length: 10 }).map((_, num) => (
                                                <div key={num} className="w-4 h-4 rounded-full border-[1.5px] border-black flex items-center justify-center text-[8px] font-bold">
                                                    {num}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* BLOQUE HORA */}
                            <div className="relative border-4 border-black p-2 bg-white">
                                <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-black"></div>
                                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black"></div>
                                <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-black"></div>
                                <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-black"></div>

                                <h3 className="text-[11px] font-black mb-1 text-center tracking-widest">HORA SALIDA</h3>
                                <div className="flex gap-2 px-1">
                                    <div className="flex gap-1">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="w-4 h-5 border-2 border-black mb-1 text-[7px] text-center">H</div>
                                            {[0, 1, 2].map(num => <div key={num} className="w-4 h-4 rounded-full border-[1.5px] border-black flex items-center justify-center text-[8px] font-bold">{num}</div>)}
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="w-4 h-5 border-2 border-black mb-1 text-[7px] text-center">H</div>
                                            {Array.from({ length: 10 }).map((_, num) => <div key={num} className="w-4 h-4 rounded-full border-[1.5px] border-black flex items-center justify-center text-[8px] font-bold">{num}</div>)}
                                        </div>
                                    </div>
                                    <div className="w-1 bg-black rounded-full mt-2 mb-2"></div>
                                    <div className="flex gap-1">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="w-4 h-5 border-2 border-black mb-1 text-[7px] text-center">M</div>
                                            {[0, 1, 2, 3, 4, 5].map(num => <div key={num} className="w-4 h-4 rounded-full border-[1.5px] border-black flex items-center justify-center text-[8px] font-bold">{num}</div>)}
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="w-4 h-5 border-2 border-black mb-1 text-[7px] text-center">M</div>
                                            {Array.from({ length: 10 }).map((_, num) => <div key={num} className="w-4 h-4 rounded-full border-[1.5px] border-black flex items-center justify-center text-[8px] font-bold">{num}</div>)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* INSTRUCCIONES COMPACTAS */}
                        <div className="bg-black text-white p-1.5 mb-4 text-[10px] text-center font-bold uppercase tracking-wide">
                            Rellene el círculo completamente. Use lapicero negro/azul. No manche fuera de los círculos.
                        </div>

                        {/* ZONA INTELIGENTE 2: RESPUESTAS */}
                        <div className={`grid gap-4 flex-1 content-start ${numCols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            {columnasPreguntas.map((columna, colIndex) => (
                                <div key={colIndex} className="relative border-4 border-black p-3 bg-white">
                                    <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-black"></div>
                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black"></div>
                                    <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-black"></div>
                                    <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-black"></div>

                                    <div className="flex flex-col gap-2">
                                        {columna.map((i) => (
                                            <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-0.5 last:border-0">
                                                <span className="font-black text-xs w-6">{i + 1}.</span>
                                                <div className="flex gap-1.5">
                                                    {['A', 'B', 'C', 'D', 'E'].map(letra => (
                                                        <div key={letra} className="w-5 h-5 rounded-full border-[1.5px] border-black flex items-center justify-center font-bold text-[9px]">
                                                            {letra}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>

            <style jsx global suppressHydrationWarning>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    #print-area { position: absolute; left: 0; top: 0; width: 100%; display: block; }
                    @page { size: A4 portrait; margin: 0; }
                    body { background: white !important; margin: 0; }
                }
            `}</style>
        </div>
    )
}