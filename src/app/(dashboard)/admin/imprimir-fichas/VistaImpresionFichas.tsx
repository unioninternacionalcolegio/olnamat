//app/(dashboard)/admin/imprimir-fichas/VistaImpresionFichas.tsx
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
    const numCols = totalPreguntas > 75 ? 4 : totalPreguntas > 35 ? 3 : 2;
    const preguntasPorColumna = Math.ceil(totalPreguntas / numCols);

    const columnasPreguntas = Array.from({ length: numCols }).map((_, colIndex) => {
        const start = colIndex * preguntasPorColumna;
        const end = Math.min(start + preguntasPorColumna, totalPreguntas);
        return Array.from({ length: end - start }).map((_, i) => start + i);
    }).filter(col => col.length > 0);

    return (
        <div className="min-h-screen bg-gray-100 p-4 font-sans">
            {/* CONTROLES */}
            <div className="print:hidden bg-white p-4 rounded-xl shadow-sm border mb-6 flex justify-between items-center sticky top-4 z-10 max-w-5xl mx-auto">
                <div className="flex items-center space-x-4">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 flex items-center">
                        <ArrowLeft className="w-5 h-5 mr-1" /> Volver
                    </button>
                    <div>
                        <h2 className="font-bold text-gray-800">Plantilla OMR (Clean Design)</h2>
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
                <div className="bg-white relative mx-auto overflow-hidden shadow-lg box-border" style={{ width: "210mm", height: "297mm" }}>

                    {/* FIDUCIALES GLOBALES DE LAS ESQUINAS DE LA HOJA */}
                    <div className="absolute top-[10mm] left-[10mm] w-[12mm] h-[12mm] bg-black"></div>
                    <div className="absolute top-[10mm] right-[10mm] w-[12mm] h-[12mm] bg-black"></div>
                    <div className="absolute bottom-[10mm] left-[10mm] w-[12mm] h-[12mm] bg-black"></div>
                    <div className="absolute bottom-[10mm] right-[10mm] w-[12mm] h-[12mm] bg-black"></div>

                    {/* CONTENEDOR PRINCIPAL */}
                    <div className="px-[25mm] py-[25mm] h-full flex flex-col">

                        {/* CABECERA Y QR */}
                        <div className="flex justify-between items-start border-b-4 border-black pb-2 mb-3">
                            
                            {/* Parte izquierda: Título + Logo */}
                            <div className="flex items-start gap-4 flex-1">
                                {/* Logo a la derecha del título */}
                                <img 
                                    src="/logo.png"           // ← Cambia esta ruta por la de tu logo
                                    alt="Logo" 
                                    className="h-24 w-auto -mt-1"  // Ajusta el tamaño según necesites
                                />
                                <div>
                                    <h1 className="text-2xl font-black uppercase tracking-tight mb-1 leading-none">
                                        FICHA OPTICA OFICIAL
                                    </h1>
                                    <div className="text-sm font-bold uppercase bg-gray-200 inline-block px-4 py-0.5 border-2 border-black">
                                        {configuracion.gradoOEdad} - {configuracion.nivel}
                                    </div>
                                </div>
                            </div>

                            {/* Parte derecha: QR */}
                            <div className="flex flex-col items-center border-4 border-black p-3 ml-4 bg-white relative">
                                <QRCode value={qrData} size={90} level="H" />
                                <span className="text-[10px] font-mono mt-1.5 font-bold">C-{configuracion.id.slice(-5)}</span>
                            </div>
                        </div>

                        {/* DATOS ESCRITOS */}
                        <div className="flex flex-col gap-2 mb-4">
                            <div className="w-full border-2 border-black h-10 flex flex-col justify-start p-1 bg-white relative">
                                <span className="text-[9px] font-black text-gray-800 absolute top-1 left-1">APELLIDOS Y NOMBRES:</span>
                            </div>
                            <div className="w-full border-2 border-black h-10 flex flex-col justify-start p-1 bg-white relative">
                                <span className="text-[9px] font-black text-gray-800 absolute top-1 left-1">I.E. PROCEDENCIA:</span>
                            </div>
                        </div>

                        {/* ZONA INTELIGENTE 1: DNI Y HORA */}
                        <div className="flex gap-6 mb-4 justify-center">

                            {/* ==================== BLOQUE CÓDIGO/DNI ==================== */}
                            <div className="relative border-4 border-black p-2 bg-white mt-2 mx-1">
                                <div className="absolute -top-3 -left-3 w-4 h-4 bg-black"></div>
                                <div className="absolute -top-3 -right-3 w-4 h-4 bg-black"></div>
                                <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-black"></div>
                                <div className="absolute -bottom-3 -right-3 w-4 h-4 bg-black"></div>

                                <h3 className="text-[10px] font-black mb-2 text-center tracking-widest bg-black text-white py-0.5">
                                    MARQUE SU CÓDIGO
                                </h3>

                                <div className="flex gap-1.5">
                                    {/* Columnas DNI SIN Timing Marks */}
                                    {Array.from({ length: 8 }).map((_, col) => (
                                        <div key={`dni-${col}`} className="flex flex-col gap-0.5">
                                            <div className="w-7 h-8 border-[2.5px] border-black mb-1 flex items-center justify-center text-base font-bold bg-gray-50"></div>
                                            {Array.from({ length: 10 }).map((_, num) => (
                                                <div
                                                    key={num}
                                                    className={`w-5 h-5 mx-auto rounded-full border-[1.5px] border-black flex items-center justify-center text-[9px] font-black
                                    bg-white`}
                                                >
                                                    {num}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ==================== BLOQUE HORA ==================== */}
                            <div className="relative border-4 border-black p-2 bg-white mt-2 mx-1">
                                <div className="absolute -top-3 -left-3 w-4 h-4 bg-black"></div>
                                <div className="absolute -top-3 -right-3 w-4 h-4 bg-black"></div>
                                <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-black"></div>
                                <div className="absolute -bottom-3 -right-3 w-4 h-4 bg-black"></div>

                                <h3 className="text-[10px] font-black mb-2 text-center tracking-widest bg-black text-white py-0.5">
                                    HORA DE SALIDA
                                </h3>

                                <div className="flex gap-1.5">
                                    {/* HORAS */}
                                    <div className="flex gap-1 border-r border-gray-300 pr-1">
                                        {[0, 1].map(c => (
                                            <div key={`h-${c}`} className="flex flex-col gap-0.5">
                                                <div className="w-7 h-8 border-[2.5px] border-black mb-1 flex items-start justify-center pt-0.5 text-[9px] font-bold bg-gray-50">
                                                    H
                                                </div>
                                                {(c === 0 ? [0, 1, 2] : Array.from({ length: 10 })).map((_, num) => (
                                                    <div
                                                        key={num}
                                                        className={`w-5 h-5 mx-auto rounded-full border-[1.5px] border-black flex items-center justify-center text-[9px] font-black
                                        bg-white`}
                                                    >
                                                        {num}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>

                                    {/* MINUTOS */}
                                    <div className="flex gap-1 border-r border-gray-300 pr-1 pl-1">
                                        {[0, 1].map(c => (
                                            <div key={`m-${c}`} className="flex flex-col gap-0.5">
                                                <div className="w-7 h-8 border-[2.5px] border-black mb-1 flex items-start justify-center pt-0.5 text-[9px] font-bold bg-gray-50">
                                                    M
                                                </div>
                                                {(c === 0 ? [0, 1, 2, 3, 4, 5] : Array.from({ length: 10 })).map((_, num) => (
                                                    <div
                                                        key={num}
                                                        className={`w-5 h-5 mx-auto rounded-full border-[1.5px] border-black flex items-center justify-center text-[9px] font-black
                                        ${num % 2 === 0 ? 'bg-white' : 'bg-gray-200'}`}
                                                    >
                                                        {num}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>

                                    {/* SEGUNDOS */}
                                    <div className="flex gap-1 pl-1">
                                        {[0, 1].map(c => (
                                            <div key={`s-${c}`} className="flex flex-col gap-0.5">
                                                <div className="w-7 h-8 border-[2.5px] border-black mb-1 flex items-start justify-center pt-0.5 text-[9px] font-bold bg-gray-50">
                                                    S
                                                </div>
                                                {(c === 0 ? [0, 1, 2, 3, 4, 5] : Array.from({ length: 10 })).map((_, num) => (
                                                    <div
                                                        key={num}
                                                        className={`w-5 h-5 mx-auto rounded-full border-[1.5px] border-black flex items-center justify-center text-[9px] font-black
                                        ${num % 2 === 0 ? 'bg-white' : 'bg-gray-200'}`}
                                                    >
                                                        {num}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* GUIA DE MARCADO CORRECTO */}
                        <div className="border-2 border-black p-3 mb-4 flex items-center justify-center gap-6 bg-gray-50 rounded">
                            <span className="text-[10px] font-black uppercase tracking-wider">GUÍA DE MARCADO:</span>

                            {/* Correcto */}
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-black border-2 border-black"></div>
                                <span className="text-[9px] font-bold text-green-700">CORRECTO</span>
                            </div>

                            {/* Incorrecto - X */}
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full border-2 border-black flex items-center justify-center text-[11px] font-black">X</div>
                                <span className="text-[9px] font-bold">INCORRECTO</span>
                            </div>

                            {/* Incorrecto - Punto */}
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full border-2 border-black flex items-center justify-center">
                                    <div className="w-2 h-2 bg-black rounded-full"></div>
                                </div>
                                <span className="text-[9px] font-bold">INCORRECTO</span>
                            </div>

                            {/* Mal Rellenado */}
                            <div className="flex items-center gap-1.5">
                                <div className="relative w-5 h-5 rounded-full border-2 border-black flex items-center justify-center overflow-hidden">
                                    <div className="w-4 h-4 bg-black rounded-full -translate-x-0.5"></div>
                                    <div className="absolute -top-10 -right-1 w-3 h-3 bg-black rounded-full opacity-80"></div>
                                </div>
                                <span className="text-[9px] font-bold text-black-600">MAL RELLENADO</span>
                            </div>
                        </div>

                        {/* ZONA INTELIGENTE 2: RESPUESTAS */}
                        <div className={`grid gap-5 flex-1 content-start ${numCols === 4 ? 'grid-cols-4' : numCols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            {columnasPreguntas.map((columna, colIndex) => (
                                <div key={colIndex} className="relative border-4 border-black p-2 bg-white mt-2 mx-1">
                                    <div className="absolute -top-2.5 -left-2.5 w-3.5 h-3.5 bg-black"></div>
                                    <div className="absolute -top-2.5 -right-2.5 w-3.5 h-3.5 bg-black"></div>
                                    <div className="absolute -bottom-2.5 -left-2.5 w-3.5 h-3.5 bg-black"></div>
                                    <div className="absolute -bottom-2.5 -right-2.5 w-3.5 h-3.5 bg-black"></div>

                                    <div className="flex flex-col">
                                        {columna.map((i) => (
                                            <div
                                                key={i}
                                                className={`flex items-center py-[2px] px-3 border-b border-gray-300 last:border-0
                            bg-white`}
                                            >
                                                <span className="font-black text-[13px] w-6 text-right mr-2 shrink-0">
                                                    {i + 1}.
                                                </span>

                                                <div className="flex gap-[10px]">
    {['A', 'B', 'C', 'D', 'E'].map(letra => (
        <div
            key={letra}
            // REDUCIDO: De w-6 h-6 a w-5 h-5. Fuente más pequeña (text-[9px]).
            className="w-5 h-5 rounded-full border-[1.5px] border-black flex items-center justify-center font-black text-[9px] bg-white text-gray-800"
        >
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

                        {/* FOOTER */}
                        <div className="mt-auto text-center border-t-2 border-black pt-1">
                            <p className="text-[8px] font-bold text-gray-500 tracking-tighter">SISTEMA OMR V20 - UNION INTERNACIONAL SAC</p>
                        </div>

                    </div>
                </div>
            </div>

            <style jsx global>{`
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