"use client"

import { useState } from "react"
import { Check, X, Eye, ExternalLink, CreditCard, Calendar } from "lucide-react"

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
            if (!res.ok) throw new Error("Error en servidor")

            setPagos(pagos.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p))
            setPagoEnRevision(null)
        } catch (error) {
            alert("No se pudo procesar el pago")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
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
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${p.estado === 'APROBADO' ? 'bg-green-100 text-green-700' :
                                    p.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {p.estado}
                                </span>
                            </td>
                            <td className="p-4">
                                <p className="font-bold text-sm text-gray-800">{p.cliente.name}</p>
                                <p className="text-xs text-gray-500 flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" /> {new Date(p.createdAt).toLocaleDateString()}
                                </p>
                            </td>
                            <td className="p-4 text-center font-bold text-gray-600">{p._count.estudiantes}</td>
                            <td className="p-4 text-center">
                                <p className="font-bold text-blue-600">S/ {p.montoTotal}</p>
                                <p className="text-[10px] text-gray-400">{p.metodo}</p>
                            </td>
                            <td className="p-4">
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => setPagoEnRevision(p)}
                                        className="flex items-center space-x-1 bg-gray-100 hover:bg-blue-600 hover:text-white px-3 py-1 rounded-lg text-sm transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span>Revisar</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* MODAL DE REVISIÓN DE VOUCHER */}
            {pagoEnRevision && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold">Revisión de Comprobante - {pagoEnRevision.cliente.name}</h3>
                            <button onClick={() => setPagoEnRevision(null)} className="text-gray-400 hover:text-red-500 font-bold">Cerrar</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Lado del Voucher */}
                            <div className="space-y-4">
                                <p className="text-sm font-bold text-gray-500 uppercase">Imagen del Voucher</p>
                                {pagoEnRevision.voucherUrl ? (
                                    <img
                                        src={pagoEnRevision.voucherUrl}
                                        alt="Voucher"
                                        className="w-full rounded-lg border shadow-md"
                                    />
                                ) : (
                                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 italic">
                                        No se subió imagen (Venta Presencial)
                                    </div>
                                )}
                                <a
                                    href={pagoEnRevision.voucherUrl}
                                    target="_blank"
                                    className="text-blue-600 text-xs flex items-center hover:underline"
                                >
                                    <ExternalLink className="w-3 h-3 mr-1" /> Abrir en pantalla completa
                                </a>
                            </div>

                            {/* Lado de Detalles y Botones */}
                            <div className="space-y-6">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <h4 className="font-bold text-blue-800 mb-2">Detalles del Depósito</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span>Monto declarado:</span><span className="font-bold">S/ {pagoEnRevision.montoTotal}</span></div>
                                        <div className="flex justify-between"><span>Método:</span><span className="font-bold">{pagoEnRevision.metodo}</span></div>
                                        <div className="flex justify-between"><span>Nro Operación:</span><span className="font-bold">{pagoEnRevision.referencia || 'N/A'}</span></div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-sm font-bold text-gray-700">Acción de Tesorería:</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => procesar(pagoEnRevision.id, 'RECHAZADO')}
                                            disabled={loading}
                                            className="flex items-center justify-center space-x-2 bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 hover:bg-red-600 hover:text-white transition-all"
                                        >
                                            <X className="w-5 h-5" />
                                            <span className="font-bold">Rechazar</span>
                                        </button>
                                        <button
                                            onClick={() => procesar(pagoEnRevision.id, 'APROBADO')}
                                            disabled={loading}
                                            className="flex items-center justify-center space-x-2 bg-green-50 text-green-600 p-4 rounded-xl border border-green-200 hover:bg-green-600 hover:text-white transition-all"
                                        >
                                            <Check className="w-5 h-5" />
                                            <span className="font-bold">Aprobar</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}