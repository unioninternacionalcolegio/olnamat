"use client"

import { useState } from "react"
import Carnet from "@/components/Carnet"
import { Printer, LayoutGrid, Square, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function VistaImpresion({ estudiantes }: { estudiantes: any[] }) {
    const router = useRouter()
    // Estado para controlar si imprimimos 1x hoja o 4x hoja
    const [formato, setFormato] = useState<'1' | '4'>('4')

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="min-h-screen">

            {/* CONTROLES (Se ocultan al imprimir) */}
            <div className="print:hidden bg-white p-4 rounded-xl shadow-sm border mb-6 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-4 z-10">
                <div className="flex items-center space-x-4">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 flex items-center">
                        <ArrowLeft className="w-5 h-5 mr-1" /> Volver
                    </button>
                    <div>
                        <h2 className="font-bold text-gray-800">Impresión de Carnets</h2>
                        <p className="text-xs text-gray-500">{estudiantes.length} carnets listos</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setFormato('1')}
                            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${formato === '1' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            <Square className="w-4 h-4 mr-2" /> 1 por hoja
                        </button>
                        <button
                            onClick={() => setFormato('4')}
                            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${formato === '4' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            <LayoutGrid className="w-4 h-4 mr-2" /> 4 por hoja
                        </button>
                    </div>

                    <button
                        onClick={handlePrint}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center shadow-md transition-colors"
                    >
                        <Printer className="w-5 h-5 mr-2" />
                        Imprimir Ahora
                    </button>
                </div>
            </div>

            {/* ÁREA DE IMPRESIÓN */}
            <div id="print-area" className={`
                justify-items-center
                ${formato === '4'
                    ? 'grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 print:gap-4'
                    : 'flex flex-col items-center gap-8'
                }
            `}>
                {estudiantes.map((est, index) => {
                    // Lógica para forzar salto de página:
                    // Si es formato 1: Salta después de CADA carnet.
                    // Si es formato 4: Salta cada 4 carnets (índices 3, 7, 11...).
                    const saltoDePagina = formato === '1' || (formato === '4' && (index + 1) % 4 === 0)

                    return (
                        <div
                            key={est.id}
                            // print:break-inside-avoid evita que un carnet se parta a la mitad
                            // print:break-after-page fuerza el salto de hoja en el PDF
                            className={`print:break-inside-avoid ${saltoDePagina ? 'print:break-after-page' : ''}`}
                        >
                            <Carnet estudiante={est} />
                        </div>
                    )
                })}
            </div>

            {/* ESTILOS GLOBALES DEFINITIVOS PARA LA IMPRESORA */}
            <style jsx global suppressHydrationWarning>{`
                @media print {
                    /* 1. Ocultar ABSOLUTAMENTE TODO el diseño de la web (Sidebars, Menús, Fondos) */
                    body * {
                        visibility: hidden;
                    }

                    /* 2. Hacer visible ÚNICAMENTE el área de impresión y lo que hay dentro */
                    #print-area, #print-area * {
                        visibility: visible;
                    }

                    /* 3. Mover el área de impresión a la esquina superior izquierda de la hoja real */
                    #print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }

                    /* 4. Forzar que la hoja del PDF sea A4 y quitar márgenes extraños */
                    @page {
                        size: A4 portrait;
                        margin: 1cm; /* Margen limpio para que no choque con los bordes */
                    }

                    body {
                        background: white !important;
                    }
                }
            `}</style>
        </div>
    )
}