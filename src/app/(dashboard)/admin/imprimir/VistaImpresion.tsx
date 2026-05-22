//app/(dashboard)/admin/imprimir/VistaImpresion.tsx
"use client"

import { useState, useEffect } from "react"
import Carnet from "@/components/Carnet"
import { Printer, LayoutGrid, Square, ArrowLeft, Loader2, FileDown } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import jsPDF from "jspdf"
import { toPng } from "html-to-image"

export default function VistaImpresion({ estudiantes }: { estudiantes: any[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [formato, setFormato] = useState<'1' | '8'>('8')

    // Estados para la carga del PDF
    const [generandoPDF, setGenerandoPDF] = useState(false)
    const [progreso, setProgreso] = useState(0)

    const action = searchParams.get('action')

    const handlePrint = () => {
        window.print()
    }

    // NUEVA FUNCIÓN: CAPTURA CARNET POR CARNET Y LOS ACOMODA EN A4
    const handleDownloadPDF = async () => {
        setGenerandoPDF(true)
        setProgreso(0)

        try {
            const pdf = new jsPDF("p", "mm", "a4")
            const isOcho = formato === '8'

            for (let i = 0; i < estudiantes.length; i++) {
                const est = estudiantes[i]
                const carnetElement = document.getElementById(`carnet-${est.id}`)
                if (!carnetElement) continue

                // 1. Capturamos CADA carnet en súper alta calidad (escala 3x)
                const dataUrl = await toPng(carnetElement, {
                    quality: 1,
                    pixelRatio: 3,
                    backgroundColor: '#ffffff'
                })

                if (isOcho) {
                    // LÓGICA: 8 POR HOJA
                    const pageIndex = Math.floor(i / 8)
                    const indexOnPage = i % 8 // Va de 0 a 7 en cada hoja

                    // Si empezamos un nuevo bloque de 8, agregamos una hoja nueva
                    if (pageIndex > 0 && indexOnPage === 0) {
                        pdf.addPage()
                    }

                    // Calculamos la posición exacta en milímetros (A4 = 210mm x 297mm)
                    const col = indexOnPage % 2 // 0 (izq) o 1 (der)
                    const row = Math.floor(indexOnPage / 2) // 0, 1, 2, 3

                    const x = col === 0 ? 4 : 106 // 4mm margen izq | 106mm inicio col derecha
                    const y = 10 + (row * 70) // 10mm top + 70mm (65mm de carnet + 5mm espacio) por fila

                    // Pegamos el carnet en el PDF (medida exacta: 100mm x 65mm)
                    pdf.addImage(dataUrl, "PNG", x, y, 100, 65)

                } else {
                    // LÓGICA: 1 POR HOJA (CENTRADO)
                    if (i > 0) pdf.addPage()

                    const x = (210 - 100) / 2 // Centrado horizontal
                    const y = (297 - 65) / 2  // Centrado vertical

                    pdf.addImage(dataUrl, "PNG", x, y, 100, 65)
                }

                // Actualizamos el progreso en pantalla
                setProgreso(i + 1)

                // Pequeña pausa de 10ms para permitir que React renderice la barra de progreso
                await new Promise(resolve => setTimeout(resolve, 10))
            }

            pdf.save("carnets-concurso.pdf")

        } catch (error) {
            console.error("Error al generar PDF:", error)
            alert("Hubo un problema al generar el PDF. Intenta imprimir usando Ctrl+P.")
        } finally {
            setGenerandoPDF(false)
            setProgreso(0)
        }
    }

    // Auto-descargar PDF al montar si viene desde el botón rojo
    useEffect(() => {
        if (action === 'pdf') {
            const timer = setTimeout(() => {
                handleDownloadPDF()
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [action])

    return (
        <div className="min-h-screen">

            {/* PANTALLA DE CARGA DEL PDF CON BARRA DE PROGRESO */}
            {generandoPDF && (
                <div className="fixed inset-0 bg-white/95 z-50 flex flex-col items-center justify-center backdrop-blur-md">
                    <Loader2 className="w-16 h-16 text-red-600 animate-spin mb-6" />
                    <h2 className="text-3xl font-black text-gray-900">Construyendo PDF</h2>
                    <p className="text-gray-500 mt-2 font-medium">Por favor no cierres ni recargues esta ventana...</p>

                    <div className="mt-8 w-80 bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                        <div
                            className="bg-red-600 h-full transition-all duration-200 ease-out rounded-full"
                            style={{ width: `${(progreso / estudiantes.length) * 100}%` }}
                        ></div>
                    </div>

                    <p className="mt-4 font-bold text-xl text-red-600">
                        {progreso} <span className="text-gray-400 text-lg">/ {estudiantes.length}</span>
                    </p>
                </div>
            )}

            {/* CONTROLES */}
            <div data-html2canvas-ignore className="print:hidden bg-white p-4 rounded-xl shadow-sm border mb-6 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-4 z-10">
                <div className="flex items-center space-x-4">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 flex items-center">
                        <ArrowLeft className="w-5 h-5 mr-1" /> Volver
                    </button>
                    <div>
                        <h2 className="font-bold text-gray-800">Impresión de Carnets</h2>
                        <p className="text-xs text-gray-500">{estudiantes.length} carnets listos</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4 flex-wrap gap-y-2 justify-center">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setFormato('1')}
                            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${formato === '1' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            <Square className="w-4 h-4 mr-2" /> 1 x hoja
                        </button>
                        <button
                            onClick={() => setFormato('8')}
                            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${formato === '8' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            <LayoutGrid className="w-4 h-4 mr-2" /> 8 x hoja
                        </button>
                    </div>

                    <button
                        onClick={handleDownloadPDF}
                        disabled={generandoPDF}
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-bold flex items-center shadow-md transition-colors"
                    >
                        <FileDown className="w-5 h-5 mr-2" />
                        Bajar PDF
                    </button>

                    <button
                        onClick={handlePrint}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold flex items-center shadow-md transition-colors"
                    >
                        <Printer className="w-5 h-5 mr-2" />
                        Imprimir Web
                    </button>
                </div>
            </div>

            {/* ÁREA DE IMPRESIÓN */}
            <div id="print-area" className={`
                justify-items-center
                ${formato === '8'
                    ? 'grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 print:gap-2'
                    : 'flex flex-col items-center gap-8'
                }
            `}>
                {estudiantes.map((est, index) => {
                    const saltoDePagina = formato === '1' || (formato === '8' && (index + 1) % 8 === 0)

                    return (
                        <div
                            key={est.id}
                            className={`print:break-inside-avoid ${saltoDePagina ? 'print:break-after-page' : ''}`}
                        >
                            {/* AÑADIDO: Wrapper con el ID específico que la librería 'html-to-image' va a escanear */}
                            <div id={`carnet-${est.id}`} className="inline-block bg-white shrink-0 overflow-hidden rounded-xl">
                                <Carnet estudiante={est} />
                            </div>
                        </div>
                    )
                })}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    #print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    @page { size: A4 portrait; margin: 1cm; }
                    body { background: white !important; }
                }
                `
            }} />
        </div>
    )
}