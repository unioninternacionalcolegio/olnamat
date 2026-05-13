"use client"
import { useState, useMemo } from "react"
import { Check, X, Eye, ExternalLink, Calendar, Printer, Search, FileSpreadsheet, UserCheck } from "lucide-react"
import * as XLSX from "xlsx"

type TabType = "TODOS" | "COLEGIO" | "DELEGADO" | "LIBRE"
type MetodoFiltro = "YAPE_PLIN" | "TRANSFERENCIA" | "EFECTIVO" | null

// Obtiene la fecha local actual en formato YYYY-MM-DD
const getLocalToday = () => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
}

export default function ListaPagos({
    iniciales,
    currentUserId,
    role
}: {
    iniciales: any[],
    currentUserId: string,
    role: string
}) {
    const [pagos, setPagos] = useState(iniciales)
    const [pagoEnRevision, setPagoEnRevision] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    // ESTADOS PARA FILTROS
    const [activeTab, setActiveTab] = useState<TabType>("TODOS")
    const [searchTerm, setSearchTerm] = useState("")
    const [fechaInicio, setFechaInicio] = useState(getLocalToday())
    const [fechaFin, setFechaFin] = useState(getLocalToday())
    const [soloMisCobros, setSoloMisCobros] = useState(false)
    const [metodoFiltro, setMetodoFiltro] = useState<MetodoFiltro>(null)

    // FUNCIÓN DE PROCESAMIENTO
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

            setPagos(pagos.map(p => p.id === id ? {
                ...p,
                estado: nuevoEstado,
                correlativo: data.pago?.correlativo,
                cajero: data.pago?.cajero
            } : p))

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

    // ===================== FILTRADO PARA LA TABLA =====================
    const pagosFiltrados = useMemo(() => {
        return pagos.filter(p => {
            // Filtro por tab
            if (activeTab !== "TODOS" && p.cliente.role !== activeTab && !(activeTab === "COLEGIO" && p.cliente.role === "REPRESENTANTE_IE")) {
                return false
            }
            // Filtro solo mis cobros
            if (soloMisCobros && p.cajeroId !== currentUserId && p.estado !== 'PENDIENTE') {
                return false
            }
            // Filtro por método de pago (SOLO AFECTA A LA TABLA)
            if (metodoFiltro) {
                if (metodoFiltro === "YAPE_PLIN") {
                    if (p.metodo !== 'YAPE' && p.metodo !== 'PLIN') return false
                } else if (metodoFiltro === "TRANSFERENCIA") {
                    if (p.metodo !== 'TRANSFERENCIA') return false
                } else if (metodoFiltro === "EFECTIVO") {
                    if (p.metodo !== 'EFECTIVO') return false
                }
            }
            // Búsqueda
            if (searchTerm) {
                const term = searchTerm.toLowerCase()
                const nameMatch = p.cliente.name?.toLowerCase().includes(term)
                const cajeroMatch = p.cajero?.name?.toLowerCase().includes(term)
                const dniMatch = p.cliente.dni?.includes(term)
                const compMatch = p.correlativo && `${p.serie}-${String(p.correlativo).padStart(6, '0')}`.toLowerCase().includes(term)
                if (!nameMatch && !dniMatch && !compMatch && !cajeroMatch) return false
            }
            // Filtro por fecha
            if (fechaInicio || fechaFin) {
                const fechaPagoStr = new Date(p.createdAt).toISOString().split('T')[0]
                if (fechaInicio && fechaPagoStr < fechaInicio) return false
                if (fechaFin && fechaPagoStr > fechaFin) return false
            }
            return true
        }).sort((a, b) => {
            if (a.estado === 'PENDIENTE' && b.estado !== 'PENDIENTE') return -1;
            if (a.estado !== 'PENDIENTE' && b.estado === 'PENDIENTE') return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
    }, [pagos, activeTab, searchTerm, fechaInicio, fechaFin, soloMisCobros, currentUserId, metodoFiltro])

    // ===================== TOTALES GLOBALES (SIN FILTRO DE MÉTODO) =====================
    const totales = useMemo(() => {
        const filtradosParaTotales = pagos.filter(p => {
            if (activeTab !== "TODOS" && p.cliente.role !== activeTab && !(activeTab === "COLEGIO" && p.cliente.role === "REPRESENTANTE_IE")) {
                return false
            }
            if (soloMisCobros && p.cajeroId !== currentUserId && p.estado !== 'PENDIENTE') {
                return false
            }
            if (fechaInicio || fechaFin) {
                const fechaPagoStr = new Date(p.createdAt).toISOString().split('T')[0]
                if (fechaInicio && fechaPagoStr < fechaInicio) return false
                if (fechaFin && fechaPagoStr > fechaFin) return false
            }
            return true
        })

        const aprobados = filtradosParaTotales.filter(p => p.estado === 'APROBADO');

        let yapePlin = 0, transferencia = 0, efectivo = 0;
        let recaudado = 0;

        aprobados.forEach(p => {
            recaudado += p.montoTotal;
            if (p.metodo === 'YAPE' || p.metodo === 'PLIN') yapePlin += p.montoTotal;
            if (p.metodo === 'TRANSFERENCIA') transferencia += p.montoTotal;
            if (p.metodo === 'EFECTIVO') efectivo += p.montoTotal;
        });

        return {
            dineroRecaudado: recaudado,
            alumnosInscritos: aprobados.reduce((sum, p) => sum + p._count.estudiantes, 0),
            pendientesCount: filtradosParaTotales.filter(p => p.estado === 'PENDIENTE').length,
            yapePlin,
            transferencia,
            efectivo
        }
    }, [pagos, activeTab, fechaInicio, fechaFin, soloMisCobros, currentUserId])

    // Toggle del filtro de método
    const toggleMetodoFiltro = (metodo: MetodoFiltro) => {
        setMetodoFiltro(metodoFiltro === metodo ? null : metodo)
    }

    // EXPORTAR A EXCEL
    const handleExportarExcel = () => {
        const aprobados = pagosFiltrados.filter(p => p.estado === 'APROBADO');
        if (aprobados.length === 0) return alert("No hay cobros aprobados para exportar con los filtros actuales.");

        const dataToExport = aprobados.map(p => {
            const listaEstudiantes = p.estudiantes?.map((e: any) => `${e.nombres} ${e.apellidos} (${e.dni || 'Sin DNI'})`).join(" | ") || "N/A";
            const fechaHora = new Date(p.createdAt).toLocaleString();

            return {
                "Comprobante": p.correlativo ? `${p.serie}-${String(p.correlativo).padStart(6, '0')}` : "N/A",
                "Fecha y Hora": fechaHora,
                "Cliente (Quien Pagó)": p.cliente.name || "Sin nombre",
                "Estudiantes Inscritos": listaEstudiantes,
                "Método": p.metodo,
                "Nro Operación": p.numeroOperacion || "N/A",
                "Descuento": p.descuento > 0 ? `S/ ${p.descuento}` : "S/ 0",
                "Total Cobrado": `S/ ${p.montoTotal}`,
                "Cajero / Aprobador": p.cajero?.name || "N/A"
            }
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte_Caja");
        const fileName = `Reporte_Caja_${fechaInicio}_al_${fechaFin}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    }

    return (
        <div className="space-y-6">
            {/* PANEL DE ESTADÍSTICAS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm">
                    <p className="text-amber-800 text-xs font-bold uppercase mb-1">Por Revisar</p>
                    <p className="text-2xl font-black text-amber-600">{totales.pendientesCount}</p>
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded-xl shadow-sm">
                    <p className="text-green-800 text-xs font-bold uppercase mb-1">Total Recaudado</p>
                    <p className="text-2xl font-black text-green-600">S/ {totales.dineroRecaudado.toFixed(2)}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm md:col-span-2">
                    <p className="text-blue-800 text-xs font-bold uppercase mb-3">Desglose por Método (click para filtrar)</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <button
                            onClick={() => toggleMetodoFiltro("YAPE_PLIN")}
                            className={`bg-white rounded-xl border p-3 transition-all hover:shadow-md ${metodoFiltro === "YAPE_PLIN" ? 'border-purple-500 ring-2 ring-purple-200' : 'border-blue-100'}`}
                        >
                            <p className="text-[10px] text-gray-500 uppercase font-bold">YAPE / PLIN</p>
                            <p className="font-bold text-purple-600 text-lg">S/ {totales.yapePlin.toFixed(2)}</p>
                        </button>

                        <button
                            onClick={() => toggleMetodoFiltro("TRANSFERENCIA")}
                            className={`bg-white rounded-xl border p-3 transition-all hover:shadow-md ${metodoFiltro === "TRANSFERENCIA" ? 'border-blue-500 ring-2 ring-blue-200' : 'border-blue-100'}`}
                        >
                            <p className="text-[10px] text-gray-500 uppercase font-bold">TRANSFERENCIA</p>
                            <p className="font-bold text-blue-600 text-lg">S/ {totales.transferencia.toFixed(2)}</p>
                        </button>

                        <button
                            onClick={() => toggleMetodoFiltro("EFECTIVO")}
                            className={`bg-white rounded-xl border p-3 transition-all hover:shadow-md ${metodoFiltro === "EFECTIVO" ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-blue-100'}`}
                        >
                            <p className="text-[10px] text-gray-500 uppercase font-bold">EFECTIVO</p>
                            <p className="font-bold text-emerald-600 text-lg">S/ {totales.efectivo.toFixed(2)}</p>
                        </button>
                    </div>
                    {metodoFiltro && (
                        <p className="text-center text-xs text-blue-600 mt-3 font-medium">
                            Filtrando tabla por: {metodoFiltro === "YAPE_PLIN" ? "Yape / Plin" : metodoFiltro} • Click nuevamente para quitar
                        </p>
                    )}
                </div>
            </div>

            {/* Resto del componente (igual que antes) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                    <div className="flex flex-wrap space-x-2">
                        {(["TODOS", "COLEGIO", "DELEGADO", "LIBRE"] as TabType[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center space-x-4">
                        {role === "ADMINISTRADOR" && (
                            <label className="flex items-center space-x-2 cursor-pointer text-sm font-bold text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border">
                                <input type="checkbox" checked={soloMisCobros} onChange={(e) => setSoloMisCobros(e.target.checked)} className="rounded text-blue-600 w-4 h-4" />
                                <span>Ver solo mis cobros</span>
                            </label>
                        )}
                        <button
                            onClick={handleExportarExcel}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-md transition-colors"
                        >
                            <FileSpreadsheet className="w-5 h-5 mr-2" />
                            Reporte Excel
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por Nombre, DNI, Ticket..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 text-sm"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-gray-500 uppercase w-12">Desde</span>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-sm text-gray-600"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-gray-500 uppercase w-12">Hasta</span>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-sm text-gray-600"
                        />
                    </div>
                </div>
            </div>
            {/* TABLA PRINCIPAL */}
            <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
                <table className="w-full text-left min-w-max">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Comprobante / Estado</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Cliente / Delegado</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Aprobado Por</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Cupos</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Monto</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {pagosFiltrados.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500 font-bold italic">No se encontraron pagos con estos filtros.</td></tr>
                        ) : pagosFiltrados.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
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
                                    <p className="font-bold text-sm text-gray-800 flex items-center">
                                        {p.cliente.name}
                                        <span className="ml-2 text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">{p.cliente.role.replace("REPRESENTANTE_IE", "COLEGIO")}</span>
                                    </p>
                                    <p className="text-xs text-gray-500 flex items-center mt-0.5">
                                        <Calendar className="w-3 h-3 mr-1" /> {new Date(p.createdAt).toLocaleDateString()}
                                    </p>
                                </td>

                                <td className="p-4">
                                    {p.estado !== 'PENDIENTE' && p.cajero ? (
                                        <div className="flex flex-col items-start">
                                            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 inline-flex items-center px-2 py-1 rounded border border-purple-100 shadow-sm">
                                                <UserCheck className="w-3 h-3 mr-1" />
                                                {p.cajero.name}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[11px] text-gray-400 italic bg-gray-100 px-2 py-1 rounded">Por asignar</span>
                                    )}
                                </td>

                                <td className="p-4 text-center font-bold text-gray-600">
                                    <span className="bg-gray-100 px-3 py-1 rounded-full">{p._count.estudiantes}</span>
                                </td>
                                <td className="p-4 text-center">
                                    <p className="font-black text-green-600">S/ {p.montoTotal.toFixed(2)}</p>
                                    {p.descuento > 0 && (
                                        <p className="text-[10px] text-red-500 font-bold mt-0.5" title="Cupón">- S/ {p.descuento}</p>
                                    )}
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{p.metodo}</p>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center space-x-2">
                                        <button
                                            onClick={() => setPagoEnRevision(p)}
                                            className="flex items-center space-x-1 bg-white border border-gray-300 hover:bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm transition-colors font-bold shadow-sm"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>Revisar</span>
                                        </button>

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
            </div>

            {/* MODAL DE REVISIÓN (Queda igual, abre el panel lateral/modal) */}
            {pagoEnRevision && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-black text-gray-800">Revisión de Comprobante - {pagoEnRevision.cliente.name}</h3>
                            <button onClick={() => setPagoEnRevision(null)} className="text-gray-400 hover:text-red-500 font-bold transition-colors">Cerrar</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <p className="text-sm font-black text-gray-500 uppercase">Imagen del Voucher</p>
                                {pagoEnRevision.comprobanteUrl ? (
                                    <>
                                        <img src={pagoEnRevision.comprobanteUrl} alt="Voucher" className="w-full rounded-xl border-2 border-gray-100 shadow-md object-contain max-h-[400px] bg-gray-50" />
                                        <a href={pagoEnRevision.comprobanteUrl} target="_blank" className="text-blue-600 text-xs flex items-center justify-center hover:underline font-bold bg-blue-50 py-2 rounded-lg transition-colors">
                                            <ExternalLink className="w-4 h-4 mr-1.5" /> Abrir imagen en pantalla completa
                                        </a>
                                    </>
                                ) : (
                                    <div className="aspect-video bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 italic font-bold">
                                        No se subió imagen
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-inner">
                                    <h4 className="font-black text-blue-800 mb-4">Detalles del Depósito</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between border-b border-blue-200/50 pb-2">
                                            <span className="text-blue-700 font-medium">Monto Pagar (Final):</span>
                                            <span className="font-black text-green-600 text-xl">S/ {pagoEnRevision.montoTotal}</span>
                                        </div>
                                        {pagoEnRevision.descuento > 0 && (
                                            <div className="flex justify-between border-b border-blue-200/50 pb-2">
                                                <span className="text-amber-700 font-medium">Descuento aplicado:</span>
                                                <span className="font-bold text-amber-700">- S/ {pagoEnRevision.descuento}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-b border-blue-200/50 pb-2">
                                            <span className="text-blue-700 font-medium">Método de Pago:</span>
                                            <span className="font-bold bg-white px-3 py-1 rounded-md text-blue-800 border border-blue-100">{pagoEnRevision.metodo}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-blue-200/50 pb-2">
                                            <span className="text-blue-700 font-medium">Nro Operación:</span>
                                            <span className="font-bold text-gray-800">{pagoEnRevision.numeroOperacion || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-blue-200/50 pb-2">
                                            <span className="text-blue-700 font-medium">Cupos Solicitados:</span>
                                            <span className="font-black text-blue-900 bg-blue-100 px-3 py-1 rounded-md">{pagoEnRevision._count.estudiantes} alumnos</span>
                                        </div>

                                        {pagoEnRevision.cajero && (
                                            <div className="flex justify-between pt-2">
                                                <span className="text-purple-700 font-medium">Aprobado Por:</span>
                                                <span className="font-bold text-purple-900 bg-purple-100 px-3 py-1 rounded-md flex items-center">
                                                    <UserCheck className="w-3 h-3 mr-1" />
                                                    {pagoEnRevision.cajero.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {pagoEnRevision.estado === 'PENDIENTE' ? (
                                    <div className="space-y-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                        <p className="text-sm font-black text-gray-800">Acción de Tesorería:</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => procesar(pagoEnRevision.id, 'RECHAZADO')} disabled={loading} className="flex items-center justify-center space-x-2 bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50">
                                                <X className="w-5 h-5" /> <span className="font-bold">Rechazar</span>
                                            </button>
                                            <button onClick={() => procesar(pagoEnRevision.id, 'APROBADO')} disabled={loading} className="flex items-center justify-center space-x-2 bg-green-500 text-white p-4 rounded-xl border border-green-600 hover:bg-green-600 transition-all shadow-md disabled:opacity-50">
                                                <Check className="w-5 h-5" /> <span className="font-bold">Aprobar</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 text-center shadow-sm">
                                        <p className="text-gray-600 font-bold flex flex-col items-center justify-center mb-4">
                                            <span className="text-2xl mb-2">{pagoEnRevision.estado === 'APROBADO' ? '✅' : '❌'}</span>
                                            Este comprobante ya fue procesado.
                                        </p>
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