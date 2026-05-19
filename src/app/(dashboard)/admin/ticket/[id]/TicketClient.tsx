//app(dashboard)/admin/ticket/[id]/TicketClient.tsx
"use client"
import { useEffect, useState, useMemo } from "react"
import Image from "next/image"

export default function TicketClient({ pago }: { pago: any }) {
    // 1. ESTADO DE MONTAJE: Para evitar cualquier error de hidratación
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Damos un segundo para que cargue todo antes de imprimir
        const timer = setTimeout(() => {
            window.print()
        }, 1000)
        return () => clearTimeout(timer)
    }, [])

    // Lógica para agrupar estudiantes por Nivel y Grado
    const resumenEstudiantes = useMemo(() => {
        if (!pago?.estudiantes) return []

        const grupos = pago.estudiantes.reduce((acc: any, estudiante: any) => {
            const key = `${estudiante.nivel} - ${estudiante.gradoOEdad}`
            if (!acc[key]) {
                acc[key] = { label: key, count: 0 }
            }
            acc[key].count += 1
            return acc
        }, {})

        return Object.values(grupos) as { label: string, count: number }[]
    }, [pago])

    // MIENTRAS CARGA EN EL SERVIDOR: No mandamos nada (evita el mismatch)
    if (!mounted) return null

    const numeroCorrelativo = pago.correlativo ? String(pago.correlativo).padStart(6, '0') : '000000'
    const nombreCajero = (pago.cajero?.name || 'SISTEMA').toUpperCase()

    // Fecha de emisión del ticket (cuando se imprimió en caja)
    const fechaEmision = new Date(pago.createdAt || new Date()).toLocaleString('es-PE', {
        dateStyle: 'short',
        timeStyle: 'short'
    })

    // Variable para saber si usamos el modelo nuevo (múltiples pagos) o el antiguo
    const esPagoMultiple = pago.detalles && pago.detalles.length > 0;

    // Fecha en la que se hizo el yape/transferencia (Modo Antiguo por retrocompatibilidad)
    const fechaTransferenciaAntigua = pago.fechaHoraPago ? new Date(pago.fechaHoraPago).toLocaleString('es-PE', {
        dateStyle: 'short',
        timeStyle: 'short'
    }) : null

    return (
        <>
            <div className="bg-gray-100 min-h-screen text-black flex justify-center py-8 print:py-0 print:bg-white">
                <div id="zona-impresion" className="w-[80mm] max-w-full bg-white px-4 py-0 font-mono text-[12px] leading-tight border shadow-xl print:shadow-none print:border-none print:m-0 print:p-0">

                    {/* Cabecera del Ticket */}
                    <div className="text-center mb-4 flex flex-col items-center">
                        <div className="relative w-40 h-40 -mb-8 grayscale print:grayscale">
                            <Image
                                src="/logo.png"
                                alt="Logo OLNAMAT"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <h2 className="font-black text-lg uppercase tracking-tight">OLNAMAT 2026</h2>
                        <p className="text-[10px] uppercase font-bold text-gray-700 mt-1">Olimpiada Nacional de Matemática</p>
                        <p className="text-[10px] mt-1 border-b border-dashed border-black pb-3 w-full">
                            Comprobante de Inscripción
                        </p>
                    </div>

                    {/* Datos del Comprobante */}
                    <div className="space-y-1 mb-4 text-[11px]">
                        <div className="flex justify-between">
                            <span className="font-bold">TICKET N°:</span>
                            <span>{pago.serie}-{numeroCorrelativo}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold">EMISIÓN:</span>
                            <span>{fechaEmision}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold">CAJERO:</span>
                            <span className="truncate max-w-[140px] font-bold">{nombreCajero}</span>
                        </div>
                        <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-gray-300">
                            <span className="font-bold">CLIENTE:</span>
                        </div>
                        <div className="uppercase pb-2 border-b border-dashed border-gray-300 font-bold">
                            {pago.cliente?.name || "SIN NOMBRE"}
                        </div>
                    </div>

                    {/* Detalle de la venta */}
                    <table className="w-full text-[11px] mb-4">
                        <thead className="border-b border-dashed border-black">
                            <tr>
                                <th className="text-left py-1 font-bold">DESCRIPCIÓN / GRADO</th>
                                <th className="text-right py-1 font-bold">CANT.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resumenEstudiantes.map((item, index) => (
                                <tr key={index} className="border-b border-dashed border-gray-200 last:border-0">
                                    <td className="py-1 align-top pr-2 text-[10px] uppercase">
                                        {item.label}
                                    </td>
                                    <td className="py-1 text-right font-bold align-top">
                                        {item.count}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totales y Forma de Pago */}
                    <div className="border-t-2 border-black pt-2 mb-6">

                        {esPagoMultiple ? (
                            /* =================== NUEVO MODO: MÚLTIPLES PAGOS =================== */
                            <div className="mb-2">
                                <span className="font-bold text-[11px] uppercase block mb-1">Desglose de Pago(s):</span>
                                {pago.detalles.map((d: any, idx: number) => {
                                    // Calculamos la fecha para este detalle específico
                                    const fechaDetalle = d.fechaHoraPago ? new Date(d.fechaHoraPago).toLocaleString('es-PE', {
                                        dateStyle: 'short',
                                        timeStyle: 'short'
                                    }) : "N/A";

                                    return (
                                        <div key={idx} className="bg-gray-100 p-2 mb-2 border border-gray-300 rounded-lg print:bg-transparent print:border-gray-500">
                                            <div className="flex justify-between items-end border-b border-gray-200 pb-1 mb-1 print:border-gray-400">
                                                <span className="text-[10px] uppercase font-black text-gray-800">{d.metodo}</span>
                                                <span className="text-[10px] font-black">S/ {d.monto.toFixed(2)}</span>
                                            </div>

                                            {d.metodo !== "EFECTIVO" && (
                                                <>
                                                    <div className="flex justify-between items-end mt-1">
                                                        <span className="font-bold text-[9px] uppercase text-gray-600">N° Operación:</span>
                                                        <span className="text-[10px] font-bold">{d.numeroOperacion || "N/A"}</span>
                                                    </div>
                                                    <div className="flex justify-between items-end mt-1">
                                                        <span className="font-bold text-[9px] uppercase text-gray-600">Fecha/Hora:</span>
                                                        <span className="text-[10px] font-bold">{fechaDetalle}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            /* =================== MODO ANTIGUO: RETROCOMPATIBILIDAD =================== */
                            <>
                                <div className="flex justify-between items-end">
                                    <span className="font-bold text-[11px] uppercase">Forma de Pago:</span>
                                    <span className="text-[11px] font-bold uppercase">{pago.metodo}</span>
                                </div>

                                {pago.metodo !== "EFECTIVO" && (
                                    <div className="bg-gray-100 p-2 mt-1 border border-gray-300 rounded-lg print:bg-transparent print:border-gray-500">
                                        <div className="flex justify-between items-end">
                                            <span className="font-bold text-[9px] uppercase text-gray-600">N° Operación:</span>
                                            <span className="text-[10px] font-bold">{pago.numeroOperacion || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between items-end mt-1">
                                            <span className="font-bold text-[9px] uppercase text-gray-600">Fecha/Hora:</span>
                                            <span className="text-[10px] font-bold">{fechaTransferenciaAntigua || "N/A"}</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* DESCUENTO Y TOTAL FINAL */}
                        {pago.descuento > 0 && (
                            <div className="flex justify-between items-end mt-2 text-red-600 print:text-black">
                                <span className="font-bold text-[11px] uppercase">Descuento:</span>
                                <span className="font-bold text-[11px]">- S/ {pago.descuento.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-end mt-2 pt-1 border-t border-black">
                            <span className="font-black text-sm uppercase">TOTAL:</span>
                            <span className="font-black text-lg">S/ {pago.montoTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Pie del ticket */}
                    <div className="text-center text-[10px] font-bold mt-4 border-t border-dashed border-black pt-4">
                        <p>¡GRACIAS POR SU PARTICIPACIÓN!</p>
                        <p className="mt-1">Conserve este comprobante.</p>
                        <p className="mt-1">Total Inscritos: {pago.estudiantes?.length || 0} alumnos</p>
                        <p className="mt-4 text-[8px] font-normal italic">Generado por Sistema OLNAMAT</p>
                    </div>
                </div>
            </div>

            {/* USAMOS UN STYLE TRADICIONAL PARA EVITAR EL ERROR DE JSX CLASSES */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 0; size: 80mm auto; }
                    body { background: white !important; -webkit-print-color-adjust: exact; }
                    header, aside, nav, footer { display: none !important; }
                    body * { visibility: hidden !important; }
                    #zona-impresion, #zona-impresion * { visibility: visible !important; }
                    #zona-impresion {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        margin: 0 !important;
                        padding: 10px !important; 
                        width: 100% !important;
                    }
                }
            `}} />
        </>
    )
}