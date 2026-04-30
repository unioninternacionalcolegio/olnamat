"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Printer, Trash2 } from "lucide-react"

type Cliente = {
    id: string,
    name: string | null,
    dni: string | null,
    institucion: string | null,
    role: string,
    tipoColegio: string
}

type ItemCarrito = {
    id: string,
    nivel: string,
    gradoOEdad: string,
    cantidad: number,
    precio: number,
    tipoPrecio: string,
    tipoColegioItem: string,
    estudianteDni?: string,
    estudianteNombres?: string,
    estudianteApellidos?: string
}

export default function CajaPOS({
    clientes: clientesIniciales,
    configuraciones,
    cajeroId
}: {
    clientes: Cliente[],
    configuraciones: any[],
    cajeroId: string
}) {
    const router = useRouter()
    const [clientes, setClientes] = useState<Cliente[]>(clientesIniciales)
    const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState("")
    const [metodoPago, setMetodoPago] = useState("EFECTIVO")

    const [numeroOperacion, setNumeroOperacion] = useState("")
    const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0])
    const [horaPago, setHoraPago] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))

    const [carrito, setCarrito] = useState<ItemCarrito[]>([])
    const [loading, setLoading] = useState(false)
    const [ticketVendido, setTicketVendido] = useState<any>(null)

    const [tipoColegioActivo, setTipoColegioActivo] = useState("ESTATAL")
    const [faseVentaActiva, setFaseVentaActiva] = useState<"REGULAR" | "EXTEMPORANEO">("REGULAR")

    const [mostrarRegistroRapido, setMostrarRegistroRapido] = useState(false)

    const [nuevoLibre, setNuevoLibre] = useState({
        dni: "", nombres: "", apellidos: "", institucion: "",
        nivel: "PRIMARIA", gradoOEdad: ""
    })

    const gradosDisponibles = useMemo(() => {
        return configuraciones
            .filter(c => c.nivel === nuevoLibre.nivel)
            .map(c => c.gradoOEdad)
    }, [configuraciones, nuevoLibre.nivel])

    useEffect(() => {
        if (gradosDisponibles.length > 0 && !gradosDisponibles.includes(nuevoLibre.gradoOEdad)) {
            setNuevoLibre(prev => ({ ...prev, gradoOEdad: gradosDisponibles[0] }))
        }
    }, [gradosDisponibles, nuevoLibre.gradoOEdad])

    const clienteActual = useMemo(() =>
        clientes.find(c => c.id === clienteSeleccionadoId),
        [clienteSeleccionadoId, clientes])

    const eliminarItem = (id: string) => {
        setCarrito(prev => prev.filter(item => item.id !== id))
    }

    const calcularPrecio = (nivel: string, grado: string, tipoCol: string) => {
        const config = configuraciones.find(c => c.nivel === nivel && c.gradoOEdad === grado)
        if (!config) return { monto: 0, fase: faseVentaActiva }

        let monto = 0
        if (faseVentaActiva === "EXTEMPORANEO") {
            if (tipoCol === 'ESTATAL') monto = config.costoEstatalExt
            else if (tipoCol === 'PARTICULAR') monto = config.costoParticularExt
            else monto = config.costoLibreExt
        } else {
            if (tipoCol === 'ESTATAL') monto = config.costoEstatalReg
            else if (tipoCol === 'PARTICULAR') monto = config.costoParticularReg
            else monto = config.costoLibreReg
        }

        return { monto, fase: faseVentaActiva }
    }

    const agregarAlCarrito = (
        nivel: string,
        grado: string,
        datosEstudiante?: { dni: string, nombres: string, apellidos: string }
    ) => {
        if (!clienteActual && !datosEstudiante) return alert("Selecciona un cliente primero.")

        const { monto, fase } = calcularPrecio(nivel, grado, tipoColegioActivo)
        const idItem = `${nivel}-${grado}-${tipoColegioActivo}-${fase}`
        const existe = carrito.find(item => item.id === idItem && !datosEstudiante)

        if (existe) {
            setCarrito(carrito.map(item => item.id === idItem ? { ...item, cantidad: item.cantidad + 1 } : item))
        } else {
            setCarrito([...carrito, {
                id: datosEstudiante ? `${idItem}-libre-${Date.now()}` : idItem,
                nivel,
                gradoOEdad: grado,
                cantidad: 1,
                precio: monto,
                tipoPrecio: fase,
                tipoColegioItem: tipoColegioActivo,
                estudianteDni: datosEstudiante?.dni,
                estudianteNombres: datosEstudiante?.nombres,
                estudianteApellidos: datosEstudiante?.apellidos
            }])
        }
    }

    const actualizarCantidad = (id: string, delta: number) => {
        setCarrito(carrito.map(item => {
            if (item.id === id) {
                const nuevaCantidad = item.cantidad + delta
                return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : item
            }
            return item
        }))
    }

    const actualizarPrecio = (id: string, nuevoPrecio: number) => {
        setCarrito(carrito.map(item =>
            item.id === id ? { ...item, precio: nuevoPrecio } : item
        ))
    }

    const registrarYSeleccionar = async () => {
        if (!nuevoLibre.dni || !nuevoLibre.nombres || !nuevoLibre.gradoOEdad) {
            return alert("Faltan datos obligatorios (DNI, Nombres o Grado).")
        }
        setLoading(true)
        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // AHORA LE PASAMOS EL TIPO DE COLEGIO QUE LA CAJERA TIENE SELECCIONADO ARRIBA
                body: JSON.stringify({ ...nuevoLibre, role: "LIBRE", tipoColegio: tipoColegioActivo }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            const nuevoUser: Cliente = {
                id: data.user.id,
                name: `${nuevoLibre.nombres} ${nuevoLibre.apellidos}`.toUpperCase(),
                dni: nuevoLibre.dni,
                institucion: nuevoLibre.institucion,
                tipoColegio: tipoColegioActivo, // SE GUARDA EN EL ESTADO CON EL TIPO CORRECTO
                role: "LIBRE"
            }
            setClientes([...clientes, nuevoUser])
            setClienteSeleccionadoId(data.user.id)

            agregarAlCarrito(nuevoLibre.nivel, nuevoLibre.gradoOEdad, {
                dni: nuevoLibre.dni,
                nombres: nuevoLibre.nombres,
                apellidos: nuevoLibre.apellidos
            })

            setMostrarRegistroRapido(false)
            setNuevoLibre({ ...nuevoLibre, dni: "", nombres: "", apellidos: "" })
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    const procesarVenta = async () => {
        if (!clienteSeleccionadoId || carrito.length === 0) return alert("Venta vacía")
        setLoading(true)
        try {
            const res = await fetch("/api/caja/ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cajeroId,
                    clienteId: clienteSeleccionadoId,
                    items: carrito,
                    metodoPago,
                    montoTotal: total,
                    numeroOperacion,
                    fechaPago,
                    horaPago
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setTicketVendido(data.ticket)
            setCarrito([])
        } catch (error: any) {
            alert(`Error al cobrar: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const total = carrito.reduce((acc, item) => acc + (item.cantidad * item.precio), 0)

    if (ticketVendido) {
        return (
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center space-y-6 max-w-2xl mx-auto border-4 border-green-50">
                <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto text-5xl">✓</div>
                <h2 className="text-4xl font-black text-gray-900">Cobro Exitoso</h2>

                <p className="text-2xl font-black text-blue-600 font-mono bg-blue-50 px-6 py-2 rounded-xl inline-block">
                    {ticketVendido.serie}-{ticketVendido.correlativo.toString().padStart(6, '0')}
                </p>

                <div className="mt-4 bg-gray-50 p-6 rounded-2xl border border-gray-100 text-left w-full mx-auto shadow-inner">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-3">Detalles de la Operación</p>
                    <div className="space-y-2">
                        <div className="flex justify-between border-b pb-1 border-gray-200">
                            <span className="text-sm font-bold text-gray-500">Método de Pago:</span>
                            <span className="text-sm font-black text-gray-800">{ticketVendido.metodo}</span>
                        </div>
                        {ticketVendido.metodo !== "EFECTIVO" && (
                            <div className="flex justify-between border-b pb-1 border-gray-200">
                                <span className="text-sm font-bold text-gray-500">N° Operación:</span>
                                <span className="text-sm font-black text-gray-800">{ticketVendido.numeroOperacion || "No registrado"}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-sm font-bold text-gray-500">Fecha y Hora:</span>
                            <span className="text-sm font-black text-gray-800">
                                {new Date(ticketVendido.fechaHoraPago).toLocaleString('es-PE', {
                                    dateStyle: 'short',
                                    timeStyle: 'short'
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                    <button onClick={() => window.open(`/admin/ticket/${ticketVendido.id}`, '_blank')} className="flex items-center justify-center space-x-3 bg-gray-500 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition-all">
                        <Printer className="w-6 h-6" /> <span>IMPRIMIR</span>
                    </button>
                    <button onClick={() => { setTicketVendido(null); setClienteSeleccionadoId(""); router.refresh() }} className="bg-gray-100 text-gray-700 px-8 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all">NUEVA VENTA</button>
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">

                {/* PANEL CLIENTE */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <label className="font-black text-gray-800 uppercase text-sm">Cliente (Quien Paga)</label>
                        <button
                            onClick={() => {
                                setMostrarRegistroRapido(!mostrarRegistroRapido)
                                if (mostrarRegistroRapido) setClienteSeleccionadoId("")
                            }}
                            className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-2 rounded-lg"
                        >
                            {mostrarRegistroRapido ? "CANCELAR" : "+ REGISTRO LIBRE RÁPIDO"}
                        </button>
                    </div>

                    {mostrarRegistroRapido ? (
                        <div className="space-y-4 bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input placeholder="DNI" className="p-3 border rounded-xl font-bold" value={nuevoLibre.dni} onChange={(e) => setNuevoLibre({ ...nuevoLibre, dni: e.target.value })} />
                                <input placeholder="NOMBRES" className="p-3 border rounded-xl font-bold uppercase" value={nuevoLibre.nombres} onChange={(e) => setNuevoLibre({ ...nuevoLibre, nombres: e.target.value })} />
                                <input placeholder="APELLIDOS" className="p-3 border rounded-xl font-bold uppercase" value={nuevoLibre.apellidos} onChange={(e) => setNuevoLibre({ ...nuevoLibre, apellidos: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input placeholder="COLEGIO" className="p-3 border rounded-xl font-bold uppercase col-span-1" value={nuevoLibre.institucion} onChange={(e) => setNuevoLibre({ ...nuevoLibre, institucion: e.target.value })} />
                                <select
                                    className="p-3 border rounded-xl font-bold bg-white"
                                    value={nuevoLibre.nivel}
                                    onChange={(e) => setNuevoLibre({ ...nuevoLibre, nivel: e.target.value })}
                                >
                                    <option value="INICIAL">INICIAL</option>
                                    <option value="PRIMARIA">PRIMARIA</option>
                                    <option value="SECUNDARIA">SECUNDARIA</option>
                                </select>

                                <select
                                    className="p-3 border rounded-xl font-bold uppercase bg-white"
                                    value={nuevoLibre.gradoOEdad}
                                    onChange={(e) => setNuevoLibre({ ...nuevoLibre, gradoOEdad: e.target.value })}
                                >
                                    {gradosDisponibles.length > 0 ? (
                                        gradosDisponibles.map(grado => (
                                            <option key={grado} value={grado}>{grado}</option>
                                        ))
                                    ) : (
                                        <option value="">Sin grados configurados</option>
                                    )}
                                </select>
                            </div>
                            <button onClick={registrarYSeleccionar} className="w-full bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-sm shadow-lg">Registrar y Auto-Agregar al Carrito</button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <select value={clienteSeleccionadoId} onChange={(e) => setClienteSeleccionadoId(e.target.value)} className="w-full p-4 border-2 border-gray-100 rounded-2xl font-bold bg-gray-50">
                                <option value="">-- BUSCAR DELEGADO / CLIENTE --</option>
                                {clientes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.dni})</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* BOTONES DE CUPOS Y CONFIGURACIÓN DE PRECIOS */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6 transition-all">

                    {/* SIEMPRE VISIBLE: CONTROLES MAESTROS PARA LA VENTA (FASE Y TIPO DE COLEGIO) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 text-center">Fase de Venta</label>
                            <div className="flex gap-2">
                                {["REGULAR", "EXTEMPORANEO"].map(fase => (
                                    <button
                                        key={fase}
                                        onClick={() => setFaseVentaActiva(fase as any)}
                                        className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${faseVentaActiva === fase ? (fase === "REGULAR" ? "bg-green-600 text-white" : "bg-red-600 text-white") : "bg-gray-200 text-gray-500 hover:bg-gray-300"}`}
                                    >
                                        {fase}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 text-center">Tipo de Colegio del Cupo</label>
                            <div className="flex gap-2">
                                {["ESTATAL", "PARTICULAR", "LIBRE"].map(tipo => (
                                    <button
                                        key={tipo}
                                        onClick={() => setTipoColegioActivo(tipo)}
                                        className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${tipoColegioActivo === tipo ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 text-gray-500 hover:bg-gray-300"}`}
                                    >
                                        {tipo}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SE OCULTA SI ESTÁ EL REGISTRO RÁPIDO ABIERTO */}
                    {!mostrarRegistroRapido && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                            {["INICIAL", "PRIMARIA", "SECUNDARIA"].map((nivel) => (
                                <div key={nivel} className="space-y-2">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase">{nivel}</h4>
                                    <div className="flex flex-col gap-1">
                                        {configuraciones.filter(c => c.nivel === nivel).map((c) => (
                                            <button key={c.id} onClick={() => agregarAlCarrito(nivel, c.gradoOEdad)} className="text-left px-4 py-2 bg-gray-50 hover:bg-blue-600 hover:text-white rounded-xl text-[11px] font-bold transition-all border border-transparent hover:border-blue-600 flex justify-between">
                                                <span>+ {c.gradoOEdad}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* CARRITO */}
            <div className="bg-white flex flex-col h-[750px] rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden sticky top-6">
                <div className="p-6 bg-gray-500 text-white flex justify-between items-center font-black text-sm uppercase">Carrito Detalle</div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {carrito.map(item => (
                        <div key={item.id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-black">{item.nivel} - {item.gradoOEdad}</p>
                                    <p className={`text-[9px] font-bold uppercase ${item.tipoPrecio === 'EXTEMPORANEO' ? 'text-red-500' : 'text-green-600'}`}>
                                        {item.tipoColegioItem} ({item.tipoPrecio})
                                    </p>
                                    {item.estudianteNombres && <p className="text-[10px] text-blue-600 font-bold mt-1">👤 {item.estudianteNombres} {item.estudianteApellidos}</p>}
                                </div>
                                <div className="flex items-center bg-white border rounded-lg h-7">
                                    <button onClick={() => actualizarCantidad(item.id, -1)} className="px-2 text-red-500 font-bold">-</button>
                                    <span className="text-xs font-black w-4 text-center">{item.cantidad}</span>
                                    <button onClick={() => actualizarCantidad(item.id, 1)} className="px-2 text-green-500 font-bold">+</button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-gray-400">S/ </span>
                                    <input
                                        type="number"
                                        step="0.50"
                                        value={item.precio}
                                        onChange={(e) => actualizarPrecio(item.id, Number(e.target.value))}
                                        className="w-16 p-1 text-xs font-bold border rounded bg-white"
                                    />
                                    <span className="text-[9px] text-gray-400 ml-1">c/u</span>
                                </div>
                                <button onClick={() => eliminarItem(item.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                    {carrito.length === 0 && <div className="text-center text-gray-400 text-xs py-10 font-bold">CARRITO VACÍO</div>}
                </div>

                {/* ZONA DE COBRO */}
                <div className="p-8 bg-gray-900 text-white space-y-4">
                    <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="w-full p-3 bg-gray-500 border border-gray-700 rounded-xl text-xs font-bold">
                        <option value="EFECTIVO">💵 EFECTIVO</option>
                        <option value="YAPE">📱 YAPE / PLIN</option>
                        <option value="TRANSFERENCIA">🏦 TRANSFERENCIA</option>
                    </select>
                    {metodoPago !== "EFECTIVO" && (
                        <div className="space-y-2">
                            <input placeholder="N° Operación" className="w-full p-2 bg-gray-500 border border-gray-700 rounded-xl text-[10px] font-bold" value={numeroOperacion} onChange={(e) => setNumeroOperacion(e.target.value)} />
                            <div className="flex gap-2">
                                <input type="date" className="w-1/2 p-2 bg-gray-500 border border-gray-700 rounded-xl text-[9px] font-bold" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
                                <input type="time" className="w-1/2 p-2 bg-gray-500 border border-gray-700 rounded-xl text-[9px] font-bold" value={horaPago} onChange={(e) => setHoraPago(e.target.value)} />
                            </div>
                        </div>
                    )}
                    <div className="flex justify-between items-center border-t border-gray-800 pt-4">
                        <span className="font-black text-sm uppercase">Total</span>
                        <span className="font-black text-2xl text-blue-400">S/ {total.toFixed(2)}</span>
                    </div>
                    <button onClick={procesarVenta} disabled={carrito.length === 0 || !clienteSeleccionadoId || loading} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-sm shadow-xl shadow-blue-900/50 hover:bg-blue-500 disabled:bg-gray-600 disabled:shadow-none transition-all">Cobrar</button>
                </div>
            </div>
        </div>
    )
}