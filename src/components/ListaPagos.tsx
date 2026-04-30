"use client"

import { useState } from "react"
import { Check, X, Eye, ExternalLink, Calendar, Printer } from "lucide-react"

export default function ListaPagos({ iniciales }: { iniciales: any[] }) {
    const [pagos, setPagos] = useState(iniciales)
    const [pagoEnRevision, setPagoEnRevision] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const procesar = async (id: string, nuevoEstado: 'APROBADO' | 'RECHAZADO') => {
        setLoading(true)
        try {
            const res = await fetch(`/api/pagos/${id}/verificar`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || "Error en servidor")

            setPagos(pagos.map(p => p.id === id ? { ...p, estado: nuevoEstado, correlativo: data.pago?.correlativo } : p))
            setPagoEnRevision(null)

            alert(data.mensaje || `El pago fue ${nuevoEstado} exitosamente.`)

            if (nuevoEstado === 'APROBADO') {
                window.open(`/admin/ticket/${id}`, '_blank')
            }

        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Comprobante / Estado</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Delegado / Cliente</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Cupos</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Monto</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {pagos.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                            <td className="p-4">
                                <div className="flex flex-col items-start gap-1">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${p.estado === 'APROBADO' ? 'bg-green-100 text-green-700' :
                                        p.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {p.estado}
                                    </span>
                                    {p.estado === 'APROBADO' && p.correlativo && (
                                        <span className="text-xs font-black text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                                            {p.serie}-{String(p.correlativo).padStart(6, '0')}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="p-4">
                                <p className="font-bold text-sm text-gray-800">{p.cliente.name}</p>
                                <p className="text-xs text-gray-500 flex items-center mt-0.5">
                                    <Calendar className="w-3 h-3 mr-1" /> {new Date(p.createdAt).toLocaleDateString()}
                                </p>
                            </td>
                            <td className="p-4 text-center font-bold text-gray-600">{p._count.estudiantes}</td>
                            <td className="p-4 text-center">
                                <p className="font-bold text-blue-600">S/ {p.montoTotal}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{p.metodo}</p>
                            </td>
                            <td className="p-4">
                                <div className="flex justify-center space-x-2">
                                    <button
                                        onClick={() => setPagoEnRevision(p)}
                                        className="flex items-center space-x-1 bg-gray-100 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-sm transition-colors font-bold shadow-sm"
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span>Revisar</span>
                                    </button>

                                    {/* BOTÓN REIMPRIMIR DIRECTO EN LA TABLA */}
                                    {p.estado === 'APROBADO' && (
                                        <button
                                            onClick={() => window.open(`/admin/ticket/${p.id}`, '_blank')}
                                            className="flex items-center space-x-1 bg-gray-800 hover:bg-black text-white px-3 py-1.5 rounded-lg text-sm transition-colors font-bold shadow-sm"
                                            title="Reimprimir Ticket"
                                        >
                                            <Printer className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* MODAL DE REVISIÓN DE VOUCHER */}
            {pagoEnRevision && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-black text-gray-800">Revisión de Comprobante - {pagoEnRevision.cliente.name}</h3>
                            <button onClick={() => setPagoEnRevision(null)} className="text-gray-400 hover:text-red-500 font-bold transition-colors">Cerrar</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Lado del Voucher */}
                            <div className="space-y-4">
                                <p className="text-sm font-black text-gray-500 uppercase">Imagen del Voucher</p>
                                {pagoEnRevision.comprobanteUrl ? (
                                    <img
                                        src={pagoEnRevision.comprobanteUrl}
                                        alt="Voucher"
                                        className="w-full rounded-xl border-2 border-gray-100 shadow-md object-contain max-h-[400px] bg-gray-50"
                                    />
                                ) : (
                                    <div className="aspect-video bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 italic font-bold">
                                        No se subió imagen (Venta Presencial o Error)
                                    </div>
                                )}
                                {pagoEnRevision.comprobanteUrl && (
                                    <a
                                        href={pagoEnRevision.comprobanteUrl}
                                        target="_blank"
                                        className="text-blue-600 text-xs flex items-center justify-center hover:underline font-bold bg-blue-50 py-2 rounded-lg transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-1.5" /> Abrir imagen en pantalla completa
                                    </a>
                                )}
                            </div>

                            {/* Lado de Detalles y Botones */}
                            <div className="space-y-6">
                                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-inner">
                                    <h4 className="font-black text-blue-800 mb-4">Detalles del Depósito</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between border-b border-blue-200/50 pb-2">
                                            <span className="text-blue-700 font-medium">Monto declarado:</span>
                                            <span className="font-black text-blue-900 text-xl">S/ {pagoEnRevision.montoTotal}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-blue-200/50 pb-2">
                                            <span className="text-blue-700 font-medium">Método de Pago:</span>
                                            <span className="font-bold bg-white px-3 py-1 rounded-md text-blue-800 border border-blue-100 shadow-sm">{pagoEnRevision.metodo}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-blue-200/50 pb-2">
                                            <span className="text-blue-700 font-medium">Nro Operación:</span>
                                            <span className="font-bold text-gray-800">{pagoEnRevision.numeroOperacion || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blue-700 font-medium">Cupos Solicitados:</span>
                                            <span className="font-black text-blue-900 bg-blue-100 px-3 py-1 rounded-md">{pagoEnRevision._count.estudiantes} alumnos</span>
                                        </div>
                                    </div>
                                </div>

                                {pagoEnRevision.estado === 'PENDIENTE' ? (
                                    <div className="space-y-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                        <p className="text-sm font-black text-gray-800">Acción de Tesorería:</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => procesar(pagoEnRevision.id, 'RECHAZADO')}
                                                disabled={loading}
                                                className="flex items-center justify-center space-x-2 bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                                            >
                                                <X className="w-5 h-5" />
                                                <span className="font-bold">Rechazar</span>
                                            </button>
                                            <button
                                                onClick={() => procesar(pagoEnRevision.id, 'APROBADO')}
                                                disabled={loading}
                                                className="flex items-center justify-center space-x-2 bg-green-500 text-white p-4 rounded-xl border border-green-600 hover:bg-green-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                                            >
                                                <Check className="w-5 h-5" />
                                                <span className="font-bold">Aprobar y Emitir</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 text-center shadow-sm">
                                        <p className="text-gray-600 font-bold flex flex-col items-center justify-center mb-4">
                                            <span className="text-2xl mb-2">{pagoEnRevision.estado === 'APROBADO' ? '✅' : '❌'}</span>
                                            Este comprobante ya fue {pagoEnRevision.estado.toLowerCase()}.
                                        </p>

                                        {/* BOTÓN REIMPRIMIR DESDE EL MODAL */}
                                        {pagoEnRevision.estado === 'APROBADO' && (
                                            <button
                                                onClick={() => window.open(`/admin/ticket/${pagoEnRevision.id}`, '_blank')}
                                                className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-black text-white p-3 rounded-xl transition-all shadow-md"
                                            >
                                                <Printer className="w-5 h-5" />
                                                <span className="font-bold">Reimprimir Ticket</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}