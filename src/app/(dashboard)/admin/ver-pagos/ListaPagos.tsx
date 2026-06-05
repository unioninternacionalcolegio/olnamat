//app/(dashboard)/admin/ver-pagos/ListaPagos.tsx
"use client"
import { useState, useMemo } from "react"
// AÑADIDO: Importamos MessageCircle para usarlo como ícono de WhatsApp
import { Check, X, Eye, ExternalLink, Calendar, Printer, Search, FileSpreadsheet, UserCheck, Wallet, Image as ImageIcon, CheckCircle, MessageCircle } from "lucide-react"
import * as XLSX from "xlsx"

type TabType = "TODOS" | "COLEGIO" | "DELEGADO" | "LIBRE"
type MetodoFiltro = "YAPE_PLIN" | "TRANSFERENCIA" | "EFECTIVO" | null

const getLocalToday = () => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
}
const getLocalToday2 = () => {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - 1);   // ← un mes antes

    // Formato YYYY-MM-DD en hora local
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};
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

    const [activeTab, setActiveTab] = useState<TabType>("TODOS")
    const [searchTerm, setSearchTerm] = useState("")
    const [fechaInicio, setFechaInicio] = useState(getLocalToday2())
    const [fechaFin, setFechaFin] = useState(getLocalToday())
    const [soloMisCobros, setSoloMisCobros] = useState(false)
    const [metodoFiltro, setMetodoFiltro] = useState<MetodoFiltro>(null)

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
                ...data.pago,
                estado: nuevoEstado,
                cajero: data.pago?.cajero || p.cajero,
                detalles: data.pago?.detalles || p.detalles
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

    const pagosFiltrados = useMemo(() => {
        return pagos.filter(p => {
            if (activeTab !== "TODOS" && p.cliente.role !== activeTab && !(activeTab === "COLEGIO" && p.cliente.role === "REPRESENTANTE_IE")) return false
            if (soloMisCobros && p.cajeroId !== currentUserId && p.estado !== 'PENDIENTE') return false

            if (metodoFiltro) {
                const metodoAntiguo = p.metodo;
                const tieneYapePlin = p.detalles?.some((d: any) => d.metodo === 'YAPE' || d.metodo === 'PLIN') || (metodoAntiguo === 'YAPE' || metodoAntiguo === 'PLIN');
                const tieneTransf = p.detalles?.some((d: any) => d.metodo === 'TRANSFERENCIA') || metodoAntiguo === 'TRANSFERENCIA';
                const tieneEfectivo = p.detalles?.some((d: any) => d.metodo === 'EFECTIVO') || metodoAntiguo === 'EFECTIVO';

                if (metodoFiltro === "YAPE_PLIN" && !tieneYapePlin) return false
                if (metodoFiltro === "TRANSFERENCIA" && !tieneTransf) return false
                if (metodoFiltro === "EFECTIVO" && !tieneEfectivo) return false
            }

            if (searchTerm) {
                const term = searchTerm.toLowerCase()
                const nameMatch = p.cliente.name?.toLowerCase().includes(term)
                const cajeroMatch = p.cajero?.name?.toLowerCase().includes(term)
                const dniMatch = p.cliente.dni?.includes(term)
                const compMatch = p.correlativo && `${p.serie}-${String(p.correlativo).padStart(6, '0')}`.toLowerCase().includes(term)
                const opMatchNuevo = p.detalles?.some((d: any) => d.numeroOperacion?.toLowerCase().includes(term))
                const opMatchViejo = p.numeroOperacion?.toLowerCase().includes(term)

                if (!nameMatch && !dniMatch && !compMatch && !cajeroMatch && !opMatchNuevo && !opMatchViejo) return false
            }

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

    const totales = useMemo(() => {
        const filtradosParaTotales = pagos.filter(p => {
            if (activeTab !== "TODOS" && p.cliente.role !== activeTab && !(activeTab === "COLEGIO" && p.cliente.role === "REPRESENTANTE_IE")) return false
            if (soloMisCobros && p.cajeroId !== currentUserId && p.estado !== 'PENDIENTE') return false
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

            if (p.detalles && p.detalles.length > 0) {
                p.detalles.forEach((d: any) => {
                    if (d.metodo === 'YAPE' || d.metodo === 'PLIN') yapePlin += d.monto;
                    if (d.metodo === 'TRANSFERENCIA') transferencia += d.monto;
                    if (d.metodo === 'EFECTIVO') efectivo += d.monto;
                });
            } else {
                if (p.metodo === 'YAPE' || p.metodo === 'PLIN') yapePlin += p.montoTotal;
                if (p.metodo === 'TRANSFERENCIA') transferencia += p.montoTotal;
                if (p.metodo === 'EFECTIVO') efectivo += p.montoTotal;
            }
        });

        return {
            dineroRecaudado: recaudado,
            alumnosInscritos: aprobados.reduce((sum, p) => sum + p._count.estudiantes, 0),
            pendientesCount: filtradosParaTotales.filter(p => p.estado === 'PENDIENTE').length,
            yapePlin, transferencia, efectivo
        }
    }, [pagos, activeTab, fechaInicio, fechaFin, soloMisCobros, currentUserId])

    const toggleMetodoFiltro = (metodo: MetodoFiltro) => setMetodoFiltro(metodoFiltro === metodo ? null : metodo)

    const handleExportarExcel = () => {
        const aprobados = pagosFiltrados.filter(p => p.estado === 'APROBADO');
        if (aprobados.length === 0) return alert("No hay cobros aprobados para exportar con los filtros actuales.");

        const dataToExport: any[] = aprobados.map(p => {
            const listaEstudiantes = p.estudiantes?.map((e: any) => `${e.nombres} ${e.apellidos} (${e.dni || 'Sin DNI'})`).join(" | ") || "N/A";
            const fechaHora = new Date(p.createdAt).toLocaleString();

            const esNuevo = p.detalles && p.detalles.length > 0;
            const metodosUsados = esNuevo ? p.detalles.map((d: any) => d.metodo).join(" + ") : p.metodo;
            const operaciones = esNuevo
                ? p.detalles.map((d: any) => d.numeroOperacion).filter(Boolean).join(" | ")
                : (p.numeroOperacion || "N/A");

            return {
                "Comprobante": p.correlativo ? `${p.serie}-${String(p.correlativo).padStart(6, '0')}` : "N/A",
                "Fecha y Hora": fechaHora,
                "Cliente (Quien Pagó)": p.cliente.name || "Sin nombre",
                "Celular": p.cliente.celular || "N/A", // Añadido celular al Excel
                "Estudiantes Inscritos": listaEstudiantes,
                "Métodos de Pago": metodosUsados,
                "Nro Operaciones": operaciones,
                "Descuento": p.descuento > 0 ? `S/ ${p.descuento}` : "S/ 0",
                "Total Pagado": `S/ ${p.montoTotal}`,
                "Cajero / Aprobador": p.cajero?.name || "N/A"
            }
        });

        // AÑADIDO: Filas de resumen al final del Excel
        dataToExport.push({}); // Fila vacía para separar
        dataToExport.push({ "Comprobante": "======= RESUMEN DEL DÍA =======" });
        dataToExport.push({ "Comprobante": "TOTAL YAPE / PLIN:", "Total Pagado": `S/ ${totales.yapePlin.toFixed(2)}` });
        dataToExport.push({ "Comprobante": "TOTAL TRANSFERENCIA:", "Total Pagado": `S/ ${totales.transferencia.toFixed(2)}` });
        dataToExport.push({ "Comprobante": "TOTAL EFECTIVO:", "Total Pagado": `S/ ${totales.efectivo.toFixed(2)}` });
        dataToExport.push({ "Comprobante": "TOTAL GENERAL RECAUDADO:", "Total Pagado": `S/ ${totales.dineroRecaudado.toFixed(2)}` });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte_Caja");
        XLSX.writeFile(workbook, `Reporte_Caja_${fechaInicio}_al_${fechaFin}.xlsx`);
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
                        <button onClick={() => toggleMetodoFiltro("YAPE_PLIN")} className={`bg-white rounded-xl border p-3 transition-all hover:shadow-md ${metodoFiltro === "YAPE_PLIN" ? 'border-purple-500 ring-2 ring-purple-200' : 'border-blue-100'}`}>
                            <p className="text-[10px] text-gray-500 uppercase font-bold">YAPE / PLIN</p>
                            <p className="font-bold text-purple-600 text-lg">S/ {totales.yapePlin.toFixed(2)}</p>
                        </button>
                        <button onClick={() => toggleMetodoFiltro("TRANSFERENCIA")} className={`bg-white rounded-xl border p-3 transition-all hover:shadow-md ${metodoFiltro === "TRANSFERENCIA" ? 'border-blue-500 ring-2 ring-blue-200' : 'border-blue-100'}`}>
                            <p className="text-[10px] text-gray-500 uppercase font-bold">TRANSFERENCIA</p>
                            <p className="font-bold text-blue-600 text-lg">S/ {totales.transferencia.toFixed(2)}</p>
                        </button>
                        <button onClick={() => toggleMetodoFiltro("EFECTIVO")} className={`bg-white rounded-xl border p-3 transition-all hover:shadow-md ${metodoFiltro === "EFECTIVO" ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-blue-100'}`}>
                            <p className="text-[10px] text-gray-500 uppercase font-bold">EFECTIVO</p>
                            <p className="font-bold text-emerald-600 text-lg">S/ {totales.efectivo.toFixed(2)}</p>
                        </button>
                    </div>
                </div>
            </div>

            {/* FILTROS Y BÚSQUEDA */}
            <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                    <div className="flex flex-wrap space-x-2">
                        {(["TODOS", "COLEGIO", "DELEGADO", "LIBRE"] as TabType[]).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center space-x-4">
                        {role === "ADMINISTRADOR" && (
                            <label className="flex items-center space-x-2 cursor-pointer text-sm font-bold text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border">
                                <input type="checkbox" checked={soloMisCobros} onChange={(e) => setSoloMisCobros(e.target.checked)} className="rounded text-blue-600 w-4 h-4" />
                                <span>Mis cobros</span>
                            </label>
                        )}
                        <button onClick={handleExportarExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-md transition-colors">
                            <FileSpreadsheet className="w-5 h-5 mr-2" /> Reporte Excel
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                        <input type="text" placeholder="Buscar por Nombre, DNI, Ticket, Operación..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 text-sm" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-gray-500 uppercase w-12">Desde</span>
                        <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-sm text-gray-600" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-gray-500 uppercase w-12">Hasta</span>
                        <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-sm text-gray-600" />
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
                            {/* AÑADIDO: Nueva columna de Contacto */}
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Contacto</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Aprobado Por</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Cupos</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Monto & Método</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {pagosFiltrados.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-gray-500 font-bold italic">No se encontraron pagos con estos filtros.</td></tr>
                        ) : pagosFiltrados.map((p) => {
                            const isMultiple = p.detalles && p.detalles.length > 1;
                            const firstMetodo = p.detalles?.length > 0 ? p.detalles[0].metodo : (p.metodo || "N/A");

                            // AÑADIDO: Lógica para generar el link de WhatsApp si tiene celular
                            let waLink = null;
                            if (p.cliente.celular) {
                                const soloNumeros = p.cliente.celular.replace(/\D/g, '');
                                // Si tiene 9 dígitos exactos, asumimos que es número de Perú y le agregamos 51
                                const celularConCodigo = soloNumeros.length === 9 ? `51${soloNumeros}` : soloNumeros;
                                const mensajeWa = encodeURIComponent(`Hola ${p.cliente.name}, te escribimos de la Olimpiada Nacional de Matemática (OLNAMAT) para informarte que se aprobo tu pago y te enviamos tu carnet para que puedas imprimirlo muchos existos te esperamos este 13 de Junio`);
                                waLink = `https://wa.me/${celularConCodigo}?text=${mensajeWa}`;
                            }

                            return (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${p.estado === 'APROBADO' ? 'bg-green-100 text-green-700' : p.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
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

                                    {/* AÑADIDO: Celda de WhatsApp */}
                                    <td className="p-4 text-center">
                                        {waLink ? (
                                            <a
                                                href={waLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center space-x-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-lg border border-green-200 hover:bg-green-100 transition-colors shadow-sm"
                                                title="Enviar WhatsApp"
                                            >
                                                <MessageCircle className="w-3 h-3" /> <span>{p.cliente.celular}</span>
                                            </a>
                                        ) : (
                                            <span className="text-[10px] text-gray-400 italic bg-gray-100 px-2 py-1 rounded">Sin número</span>
                                        )}
                                    </td>

                                    <td className="p-4">
                                        {p.estado !== 'PENDIENTE' && p.cajero ? (
                                            <div className="flex flex-col items-start">
                                                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 inline-flex items-center px-2 py-1 rounded border border-purple-100 shadow-sm">
                                                    <UserCheck className="w-3 h-3 mr-1" /> {p.cajero.name}
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
                                        {p.descuento > 0 && <p className="text-[10px] text-red-500 font-bold mt-0.5">- S/ {p.descuento}</p>}
                                        <p className={`text-[10px] font-bold uppercase mt-1 px-2 py-0.5 rounded inline-block ${isMultiple ? 'bg-blue-100 text-blue-700' : 'text-gray-400'}`}>
                                            {isMultiple ? "MÚLTIPLE" : firstMetodo}
                                        </p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center space-x-2">
                                            <button onClick={() => setPagoEnRevision(p)} className="flex items-center space-x-1 bg-white border border-gray-300 hover:bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm transition-colors font-bold shadow-sm">
                                                <Eye className="w-4 h-4" /> <span>Revisar</span>
                                            </button>
                                            {p.estado === 'APROBADO' && (
                                                <button onClick={() => window.open(`/admin/ticket/${p.id}`, '_blank')} className="flex items-center space-x-1 bg-gray-400 hover:bg-black text-white px-3 py-1.5 rounded-lg text-sm transition-colors font-bold shadow-sm" title="Reimprimir Ticket">
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* ================= MODAL DE REVISIÓN MULTI-PAGO ================= */}
            {pagoEnRevision && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-black text-gray-800 flex items-center">
                                <Wallet className="w-5 h-5 mr-2 text-blue-600" />
                                Revisión de Ticket - {pagoEnRevision.cliente.name}
                            </h3>
                            <button onClick={() => setPagoEnRevision(null)} className="text-gray-400 hover:text-red-500 font-bold transition-colors">Cerrar</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-inner mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-xs text-blue-600 font-bold uppercase mb-1">Monto Pagar (Final)</p>
                                        <p className="text-2xl font-black text-green-600">S/ {pagoEnRevision.montoTotal.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-600 font-bold uppercase mb-1">Cupos Solicitados</p>
                                        <p className="text-xl font-bold text-blue-900">{pagoEnRevision._count.estudiantes} Alumnos</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-600 font-bold uppercase mb-1">Descuento / Cupón</p>
                                        <p className="text-xl font-bold text-amber-600">{pagoEnRevision.descuento > 0 ? `- S/ ${pagoEnRevision.descuento}` : 'S/ 0.00'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-600 font-bold uppercase mb-1">Total Transacciones</p>
                                        <p className="text-xl font-bold text-gray-800">
                                            {pagoEnRevision.detalles?.length > 0 ? pagoEnRevision.detalles.length : 1}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <h4 className="font-black text-gray-700 mb-4 uppercase text-sm border-b pb-2">Desglose de Comprobantes</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {(() => {
                                    const listaADibujar = pagoEnRevision.detalles && pagoEnRevision.detalles.length > 0
                                        ? pagoEnRevision.detalles
                                        : [{
                                            id: 'pago-antiguo',
                                            monto: pagoEnRevision.montoTotal,
                                            metodo: pagoEnRevision.metodo || 'N/A',
                                            numeroOperacion: pagoEnRevision.numeroOperacion,
                                            comprobanteUrl: pagoEnRevision.comprobanteUrl,
                                            fechaHoraPago: pagoEnRevision.createdAt
                                        }];

                                    return listaADibujar.map((detalle: any, i: number) => (
                                        <div key={detalle.id} className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
                                            <div className="p-4 border-b bg-gray-50 relative">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                                <p className="text-xs text-gray-500 flex justify-between mb-1">
                                                    <span className="font-bold">Pago #{i + 1}</span>
                                                    <span>{new Date(detalle.fechaHoraPago).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                </p>
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-lg font-black text-gray-800">S/ {detalle.monto.toFixed(2)}</p>
                                                        <p className="text-[10px] font-bold text-white bg-gray-700 px-2 py-0.5 rounded inline-block uppercase mt-1">{detalle.metodo}</p>
                                                    </div>
                                                    {detalle.numeroOperacion && (
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Nro. Operación</p>
                                                            <p className="text-sm font-bold text-blue-600">{detalle.numeroOperacion}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-4 flex-1 flex flex-col justify-center items-center bg-white min-h-[150px]">
                                                {detalle.comprobanteUrl ? (
                                                    <div className="w-full">
                                                        <a href={detalle.comprobanteUrl} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg border border-gray-200">
                                                            <img src={detalle.comprobanteUrl} alt={`Voucher ${i + 1}`} className="w-full h-32 object-cover group-hover:scale-105 transition-transform" />
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <ExternalLink className="text-white w-6 h-6" />
                                                            </div>
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-400 flex flex-col items-center">
                                                        <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                                        <span className="text-xs font-bold uppercase">Sin Imagen</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>

                            <div className="border-t pt-6">
                                {pagoEnRevision.estado === 'PENDIENTE' ? (
                                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm max-w-xl mx-auto">
                                        <p className="text-sm font-black text-gray-800 mb-4 text-center">Acción de Tesorería General:</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => procesar(pagoEnRevision.id, 'RECHAZADO')} disabled={loading} className="flex items-center justify-center space-x-2 bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50">
                                                <X className="w-5 h-5" /> <span className="font-bold">Rechazar Todo</span>
                                            </button>
                                            <button onClick={() => procesar(pagoEnRevision.id, 'APROBADO')} disabled={loading} className="flex items-center justify-center space-x-2 bg-green-500 text-white p-4 rounded-xl border border-green-600 hover:bg-green-600 transition-all shadow-md disabled:opacity-50">
                                                <CheckCircle className="w-5 h-5" /> <span className="font-bold">Aprobar Todo</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-100 p-5 rounded-xl border border-gray-200 text-center shadow-inner max-w-xl mx-auto">
                                        <p className="text-gray-600 font-bold flex items-center justify-center">
                                            <span className="text-2xl mr-3">{pagoEnRevision.estado === 'APROBADO' ? '✅' : '❌'}</span>
                                            Este Ticket Maestro ya fue procesado y su estado es {pagoEnRevision.estado}.
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