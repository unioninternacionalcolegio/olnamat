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

            {/* CONTROLES (Se ocultan al imprimir gracias a print:hidden) */}
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
            {/* La clase print:grid-cols-2 fuerza que en el PDF salgan en 2 columnas (4 por hoja) o 1 columna (1 por hoja) */}
            <div id="print-area" className={`
        grid gap-8 justify-items-center
        ${formato === '4'
                    ? 'grid-cols-1 md:grid-cols-2 print:grid-cols-2 print:gap-y-[2cm] print:gap-x-[1cm]'
                    : 'grid-cols-1 print:grid-cols-1 print:gap-y-[15cm]' // gap grande para forzar salto de página si es 1 por hoja
                }
      `}>
                {estudiantes.map((est) => (
                    <div key={est.id} className="print:break-inside-avoid">
                        <Carnet estudiante={est} />
                    </div>
                ))}
            </div>

            {/* ESTILOS GLOBALES PARA LA IMPRESORA */}
            <style jsx global>{`
        @media print {
          /* Ocultar elementos del layout principal de Next.js (Sidebar, header, etc) */
          header, aside, nav { display: none !important; }
          
          /* Configurar el tamaño de la hoja A4 */
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }

          /* Asegurarnos que el fondo blanco de la página principal no tape nada */
          body { 
            background: white !important; 
            padding: 0 !important;
          }

          /* Eliminar márgenes del contenedor principal para usar toda la hoja */
          main {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }
        }
      `}</style>
        </div>
    )
}