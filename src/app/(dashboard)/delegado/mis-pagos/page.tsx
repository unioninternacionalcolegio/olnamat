import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { ExternalLink, Clock, CheckCircle, XCircle, Receipt } from "lucide-react"

export default async function MisPagosPage() {
    const session = await getServerSession(authOptions)

    if (!session || !["DELEGADO", "REPRESENTANTE_IE", "LIBRE"].includes(session.user.role)) {
        redirect("/")
    }

    // Traemos SOLO los pagos que le pertenecen a este usuario
    const misPagos = await prisma.pago.findMany({
        where: { clienteId: session.user.id },
        include: {
            _count: {
                select: { estudiantes: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Historial de Pagos</h1>
                <p className="text-gray-600">Revisa el estado de las validaciones de tus vouchers.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Fecha</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Detalle</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Inscritos</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Estado</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Voucher</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {misPagos.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400">
                                    Aún no tienes pagos registrados.
                                </td>
                            </tr>
                        ) : (
                            misPagos.map((pago) => (
                                <tr key={pago.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-sm text-gray-800">
                                            {new Date(pago.createdAt).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(pago.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-bold text-blue-600">S/ {pago.montoTotal.toFixed(2)}</p>
                                        <p className="text-[10px] text-gray-500 uppercase">{pago.metodo} - OP: {pago.numeroOperacion}</p>
                                    </td>
                                    <td className="p-4 text-center font-bold text-gray-600">
                                        {pago._count.estudiantes}
                                    </td>
                                    <td className="p-4 text-center">
                                        {pago.estado === 'APROBADO' && (
                                            <span className="inline-flex items-center bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">
                                                <CheckCircle className="w-3 h-3 mr-1" /> APROBADO
                                            </span>
                                        )}
                                        {pago.estado === 'PENDIENTE' && (
                                            <span className="inline-flex items-center bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-xs font-bold">
                                                <Clock className="w-3 h-3 mr-1" /> REVISANDO
                                            </span>
                                        )}
                                        {pago.estado === 'RECHAZADO' && (
                                            <span className="inline-flex items-center bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs font-bold">
                                                <XCircle className="w-3 h-3 mr-1" /> RECHAZADO
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        {pago.comprobanteUrl ? (
                                            <a
                                                href={pago.comprobanteUrl}
                                                target="_blank"
                                                className="inline-flex items-center justify-center p-2 bg-gray-100 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                                title="Ver foto del voucher"
                                            >
                                                <Receipt className="w-4 h-4" />
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400">Presencial</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}