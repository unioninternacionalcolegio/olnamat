//app/(dashboard)/admin/caja/CajaPOS.tsx
"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Printer, Trash2, Tag, Search, Building2, Plus, ChevronDown, ChevronUp } from "lucide-react"

type Cliente = {
    id: string,
    name: string | null,
    dni: string | null,
    institucion: string | null,
    role: string,
    tipoColegio: string,
    celular?: string | null
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

// AÑADIDO: Fecha y hora individuales por cada método de pago
type PagoParcial = {
    metodo: string,
    monto: number,
    numeroOperacion: string,
    fecha: string,
    hora: string
}

export default function CajaPOS({
    clientes = [],
    configuraciones = [],
    cajeroId = ""
}: {
    clientes?: Cliente[],
    configuraciones?: any[],
    cajeroId?: string
}) {
    const router = useRouter()

    const safeConfiguraciones = Array.isArray(configuraciones) ? configuraciones : []
    const safeClientes = Array.isArray(clientes) ? clientes : []

    const [clientesList, setClientesList] = useState<Cliente[]>(safeClientes)
    const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState("")

    // AÑADIDO: Inicializamos con la fecha y hora actuales
    const [pagosParciales, setPagosParciales] = useState<PagoParcial[]>([
        {
            metodo: "EFECTIVO",
            monto: 0,
            numeroOperacion: "",
            fecha: new Date().toISOString().split('T')[0],
            hora: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        }
    ])

    const [carrito, setCarrito] = useState<ItemCarrito[]>([])
    const [loading, setLoading] = useState(false)
    const [ticketVendido, setTicketVendido] = useState<any>(null)

    const [tipoColegioActivo, setTipoColegioActivo] = useState("ESTATAL")
    const [faseVentaActiva, setFaseVentaActiva] = useState<"REGULAR" | "EXTEMPORANEO">("REGULAR")

    const [mostrarRegistroRapido, setMostrarRegistroRapido] = useState(false)
    const [mostrarCuposRapidos, setMostrarCuposRapidos] = useState(false)

    const [descuentoManual, setDescuentoManual] = useState<number>(0)

    const [nuevoLibre, setNuevoLibre] = useState({
        dni: "", nombres: "", apellidos: "", institucion: "", celular: "",
        nivel: "PRIMARIA", gradoOEdad: ""
    })

    const gradosDisponibles = useMemo(() => {
        return safeConfiguraciones
            .filter(c => c && c.nivel === nuevoLibre.nivel)
            .map(c => c.gradoOEdad)
    }, [safeConfiguraciones, nuevoLibre.nivel])

    const delegados = useMemo(() => safeClientes.filter(c => c && c.role === 'DELEGADO'), [safeClientes])

    const colegiosUnicos = useMemo(() => {
        const set = new Set<string>()
        clientesList.forEach(c => {
            if (c && c.institucion && c.institucion.trim() !== "" && c.institucion.toUpperCase() !== "ALUMNO LIBRE") {
                let instLimpia = c.institucion.toUpperCase();
                if (instLimpia.startsWith("LIBRE-")) {
                    instLimpia = instLimpia.replace("LIBRE-", "").trim();
                }
                set.add(instLimpia)
            }
        })
        return Array.from(set).sort()
    }, [clientesList])

    const [busquedaDelegado, setBusquedaDelegado] = useState("")
    const [mostrarOpcionesDelegado, setMostrarOpcionesDelegado] = useState(false)
    const delegadosFiltrados = delegados.filter(d =>
        d.name?.toLowerCase().includes(busquedaDelegado.toLowerCase()) ||
        d.dni?.includes(busquedaDelegado)
    )

    useEffect(() => {
        if (gradosDisponibles.length > 0 && !gradosDisponibles.includes(nuevoLibre.gradoOEdad)) {
            setNuevoLibre(prev => ({ ...prev, gradoOEdad: gradosDisponibles[0] }))
        }
    }, [gradosDisponibles, nuevoLibre.gradoOEdad])

    const clienteActual = useMemo(() =>
        clientesList.find(c => c.id === clienteSeleccionadoId),
        [clienteSeleccionadoId, clientesList])

    const eliminarItem = (id: string) => {
        setCarrito(prev => prev.filter(item => item.id !== id))
    }

    const calcularPrecio = (nivel: string, grado: string, tipoCol: string) => {
        const config = safeConfiguraciones.find(c => c.nivel === nivel && c.gradoOEdad === grado)
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
        if (!clienteActual && !datosEstudiante && !clienteSeleccionadoId) return alert("Selecciona un delegado/cliente primero.")

        const { monto, fase } = calcularPrecio(nivel, grado, tipoColegioActivo)
        const idItem = `${nivel}-${grado}-${tipoColegioActivo}-${fase}`
        const existe = carrito.find(item => item.id === idItem && !datosEstudiante)

        if (existe) {
            setCarrito(carrito.map(item => item.id === idItem ? { ...item, cantidad: item.cantidad + 1 } : item))
        } else {
            setCarrito([...carrito, {
                id: datosEstudiante ? `${idItem}-indep-${Date.now()}` : idItem,
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
        if (!nuevoLibre.nombres || !nuevoLibre.gradoOEdad || !nuevoLibre.institucion.trim()) {
            return alert("Faltan datos obligatorios (Nombres, Grado o Colegio).")
        }

        let dniFinal = nuevoLibre.dni.trim()

        if (!dniFinal) {
            const currentL = clientesList
                .filter(c => c.dni?.startsWith('L'))
                .map(c => parseInt(c.dni!.replace('L', '')))
                .filter(n => !isNaN(n));
            const nextNum = currentL.length > 0 ? Math.max(...currentL) + 1 : 1;
            dniFinal = "L" + nextNum.toString().padStart(4, '0');
        }

        let instFinal = nuevoLibre.institucion.trim().toUpperCase()
        if (tipoColegioActivo === 'LIBRE' && !instFinal.startsWith("LIBRE-")) {
            instFinal = `LIBRE-${instFinal}`
        }

        setLoading(true)
        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dni: dniFinal,
                    nombres: nuevoLibre.nombres,
                    apellidos: nuevoLibre.apellidos,
                    institucion: instFinal,
                    celular: nuevoLibre.celular,
                    nivel: nuevoLibre.nivel,
                    gradoOEdad: nuevoLibre.gradoOEdad,
                    role: "LIBRE",
                    tipoColegio: tipoColegioActivo
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            const nuevoUser: Cliente = {
                id: data.user.id,
                name: `${nuevoLibre.nombres} ${nuevoLibre.apellidos}`.toUpperCase(),
                dni: data.user.dni,
                institucion: instFinal,
                tipoColegio: tipoColegioActivo,
                role: "LIBRE",
                celular: nuevoLibre.celular
            }

            setClientesList([...clientesList, nuevoUser])

            if (!clienteSeleccionadoId) {
                setClienteSeleccionadoId(data.user.id)
                setBusquedaDelegado(`${nuevoUser.name} (${nuevoUser.dni})`)
            }

            agregarAlCarrito(nuevoLibre.nivel, nuevoLibre.gradoOEdad, {
                dni: data.user.dni,
                nombres: nuevoLibre.nombres,
                apellidos: nuevoLibre.apellidos
            })

            setNuevoLibre({ ...nuevoLibre, dni: "", nombres: "", apellidos: "" })
            alert(`Estudiante ${nuevoLibre.nombres} agregado al carrito. Puedes registrar otro si deseas.`)

        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    const [errorDniLibre, setErrorDniLibre] = useState(false)

    const verificarDniCaja = async (dni: string) => {
        if (!dni || dni.length < 8) {
            setErrorDniLibre(false); return;
        }
        try {
            const res = await fetch('/api/estudiantes/verificar-dnis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dnis: [dni] })
            })
            const data = await res.json()
            setErrorDniLibre(data.registrados && data.registrados.includes(dni))
        } catch (error) {
            console.error(error)
        }
    }

    const subtotal = carrito.reduce((acc, item) => acc + (item.cantidad * item.precio), 0)
    const total = Math.max(0, subtotal - (descuentoManual || 0))

    useEffect(() => {
        if (pagosParciales.length === 1) {
            setPagosParciales([{ ...pagosParciales[0], monto: total }])
        }
    }, [total])

    const totalPagos = pagosParciales.reduce((sum, pago) => sum + Number(pago.monto), 0)
    const saldoRestante = total - totalPagos

    const actualizarPagoParcial = (index: number, campo: keyof PagoParcial, valor: string | number) => {
        const nuevos = [...pagosParciales]
        nuevos[index] = { ...nuevos[index], [campo]: valor }
        setPagosParciales(nuevos)
    }

    const procesarVenta = async () => {
        if (!clienteSeleccionadoId || carrito.length === 0) return alert("Venta vacía")

        if (Math.abs(totalPagos - total) > 0.01) {
            return alert(`Los pagos parciales (S/ ${totalPagos.toFixed(2)}) no coinciden con el total (S/ ${total.toFixed(2)}).`)
        }

        for (const p of pagosParciales) {
            if (p.metodo !== "EFECTIVO" && !p.numeroOperacion.trim()) {
                return alert(`El N° de Operación es obligatorio para ${p.metodo}.`)
            }
        }

        // AÑADIDO: Preparamos los pagos parciales enviando el string "fechaHoraPago" para la API
        const pagosFormateados = pagosParciales.map(p => ({
            metodo: p.metodo,
            monto: p.monto,
            numeroOperacion: p.numeroOperacion,
            fechaHoraPago: `${p.fecha}T${p.hora}` // La API en route.ts ya espera este formato
        }))

        setLoading(true)
        try {
            const res = await fetch("/api/caja/ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cajeroId,
                    clienteId: clienteSeleccionadoId,
                    items: carrito,
                    pagosParciales: pagosFormateados,
                    montoTotal: total,
                    descuento: descuentoManual,
                    subtotal: subtotal
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setTicketVendido(data.ticket)
            setCarrito([])
            setDescuentoManual(0)
            setPagosParciales([{
                metodo: "EFECTIVO",
                monto: 0,
                numeroOperacion: "",
                fecha: new Date().toISOString().split('T')[0],
                hora: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            }])
            setBusquedaDelegado("")
        } catch (error: any) {
            alert(`Error al cobrar: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

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
                        {ticketVendido.detalles && ticketVendido.detalles.length > 0 ? (
                            ticketVendido.detalles.map((d: any, idx: number) => (
                                <div key={idx} className="border-b pb-2 mb-2 last:border-0 border-gray-200">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-bold text-gray-500">Método de Pago:</span>
                                        <div className="flex gap-4">
                                            <span className="text-sm font-black text-gray-800">{d.metodo}</span>
                                            <span className="text-sm font-black text-green-600">S/ {Number(d.monto).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    {d.metodo !== "EFECTIVO" && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-bold text-gray-500">N° Operación:</span>
                                                <span className="text-sm font-black text-gray-800">{d.numeroOperacion || "No registrado"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-bold text-gray-500">Fecha de Depósito:</span>
                                                <span className="text-sm font-black text-gray-800">
                                                    {d.fechaHoraPago ? new Date(d.fechaHoraPago).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : "No registrado"}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        ) : null}

                        <div className="flex justify-between border-b pb-1 border-gray-200 mt-2">
                            <span className="text-sm font-bold text-gray-500">Total Pagado:</span>
                            <span className="text-sm font-black text-green-600">S/ {Number(ticketVendido.montoTotal).toFixed(2)}</span>
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

                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
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
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 text-center">Tipo de Colegio</label>
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
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <label className="font-black text-gray-800 uppercase text-sm">Cliente (Delegado o Alumno)</label>
                        <button
                            onClick={() => {
                                setMostrarRegistroRapido(!mostrarRegistroRapido)
                                if (!mostrarRegistroRapido) {
                                    setClienteSeleccionadoId("")
                                    setBusquedaDelegado("")
                                }
                            }}
                            className={`text-[10px] font-black px-3 py-2 rounded-lg transition-colors ${mostrarRegistroRapido ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}
                        >
                            {mostrarRegistroRapido ? "X CERRAR PANEL REGISTRO" : "+ REGISTRO RÁPIDO"}
                        </button>
                    </div>

                    {mostrarRegistroRapido ? (
                        <div className="space-y-4 bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="text-xs text-gray-500 font-bold mb-2">
                                Si el padre pagará por varios hijos, llena los datos de uno y dale a "Agregar". Luego cambia los nombres para el siguiente y dale a "Agregar" nuevamente. Saldrán en un solo ticket.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <input
                                        placeholder="DNI"
                                        className={`w-full p-3 border rounded-xl font-bold ${errorDniLibre ? 'border-red-500 bg-red-50 text-red-600' : ''}`}
                                        maxLength={8}
                                        value={nuevoLibre.dni}
                                        onChange={(e) => {
                                            setNuevoLibre({ ...nuevoLibre, dni: e.target.value })
                                            setErrorDniLibre(false)
                                        }}
                                        onBlur={(e) => verificarDniCaja(e.target.value)}
                                    />
                                    {errorDniLibre && <span className="text-[10px] text-red-500 font-bold ml-1">¡DNI ya registrado!</span>}
                                </div>
                                <input placeholder="NOMBRES" className="p-3 border rounded-xl font-bold uppercase" value={nuevoLibre.nombres} onChange={(e) => setNuevoLibre({ ...nuevoLibre, nombres: e.target.value })} />
                                <input placeholder="APELLIDOS" className="p-3 border rounded-xl font-bold uppercase" value={nuevoLibre.apellidos} onChange={(e) => setNuevoLibre({ ...nuevoLibre, apellidos: e.target.value })} />

                                <input
                                    placeholder="CELULAR (Opcional)"
                                    className="p-3 border rounded-xl font-bold"
                                    type="tel"
                                    maxLength={9}
                                    value={nuevoLibre.celular}
                                    onChange={(e) => setNuevoLibre({ ...nuevoLibre, celular: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="col-span-1 relative">
                                    <div className="absolute top-0 left-0 text-[8px] font-bold text-blue-500 bg-blue-50 px-1 rounded-br-lg">
                                        COLEGIO
                                    </div>
                                    <input
                                        placeholder="Escribe o selecciona colegio..."
                                        className="w-full p-3 pt-4 border rounded-xl font-bold uppercase"
                                        value={nuevoLibre.institucion}
                                        onChange={(e) => setNuevoLibre({ ...nuevoLibre, institucion: e.target.value })}
                                        list="colegios-list"
                                    />
                                    <datalist id="colegios-list">
                                        {colegiosUnicos.map(col => <option key={col} value={col} />)}
                                    </datalist>
                                </div>

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
                                        <option value="">Sin grados</option>
                                    )}
                                </select>
                            </div>
                            <button
                                onClick={registrarYSeleccionar}
                                disabled={errorDniLibre || !nuevoLibre.nombres || !nuevoLibre.gradoOEdad || !nuevoLibre.institucion.trim() || loading}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-sm shadow-lg disabled:bg-gray-400 disabled:shadow-none hover:bg-blue-700"
                            >
                                <Plus className="w-5 h-5" /> Agregar Estudiante al Carrito
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2 relative">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar DELEGADO por nombre o DNI..."
                                    className="w-full p-4 pl-12 border-2 border-gray-100 rounded-2xl font-bold bg-gray-50 focus:border-blue-500 focus:outline-none"
                                    value={busquedaDelegado}
                                    onChange={e => {
                                        setBusquedaDelegado(e.target.value);
                                        setMostrarOpcionesDelegado(true);
                                        if (e.target.value === "") setClienteSeleccionadoId("");
                                    }}
                                    onFocus={() => setMostrarOpcionesDelegado(true)}
                                    onBlur={() => setTimeout(() => setMostrarOpcionesDelegado(false), 200)}
                                />
                            </div>
                            {mostrarOpcionesDelegado && busquedaDelegado && (
                                <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-auto">
                                    {delegadosFiltrados.map(d => (
                                        <div
                                            key={d.id}
                                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                                            onClick={() => {
                                                setClienteSeleccionadoId(d.id);
                                                setBusquedaDelegado(`${d.name} (${d.dni})`);
                                                setMostrarOpcionesDelegado(false);
                                            }}
                                        >
                                            <p className="font-bold text-sm text-gray-800">{d.name}</p>
                                            <p className="text-[10px] font-bold text-gray-500 flex items-center mt-1">
                                                <span className="text-blue-500 mr-2">{d.dni}</span>
                                                <Building2 className="w-3 h-3 mr-1" /> {d.institucion || "Sin colegio"}
                                            </p>
                                        </div>
                                    ))}
                                    {delegadosFiltrados.length === 0 && (
                                        <div className="p-4 text-sm text-center text-gray-500 font-bold">No se encontraron delegados</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {!mostrarRegistroRapido && (
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4 transition-all">
                        <div className="flex justify-between items-center cursor-pointer border-b pb-2 border-gray-100" onClick={() => setMostrarCuposRapidos(!mostrarCuposRapidos)}>
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Cupos Rápidos (Cantidades libres)</h3>
                            {mostrarCuposRapidos ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </div>

                        {mostrarCuposRapidos && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                {["INICIAL", "PRIMARIA", "SECUNDARIA"].map((nivel) => (
                                    <div key={nivel} className="space-y-2">
                                        <h4 className="text-[10px] font-black text-blue-500 uppercase">{nivel}</h4>
                                        <div className="flex flex-col gap-1">
                                            {safeConfiguraciones.filter(c => c && c.nivel === nivel).map((c) => (
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
                )}

            </div>

            <div className="bg-white flex flex-col h-[750px] rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden sticky top-6">
                <div className="p-6 bg-gray-500 text-white flex justify-between items-center font-black text-sm uppercase">
                    <span>Carrito Detalle</span>
                    {clienteSeleccionadoId && <span className="text-[10px] bg-gray-600 px-2 py-1 rounded">Titular Asignado</span>}
                </div>
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

                <div className="p-8 bg-gray-800 text-white space-y-4">

                    <div className="space-y-3 bg-gray-700/50 p-4 rounded-2xl border border-gray-600">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black uppercase text-gray-300">Métodos de Pago</span>
                            {saldoRestante !== 0 && (
                                <span className={`text-[10px] font-black px-2 py-1 rounded ${saldoRestante > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {saldoRestante > 0 ? `Falta S/ ${saldoRestante.toFixed(2)}` : `Exceso S/ ${Math.abs(saldoRestante).toFixed(2)}`}
                                </span>
                            )}
                        </div>

                        {pagosParciales.map((pago, index) => (
                            <div key={index} className="space-y-2 border-b border-gray-600 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0 relative">
                                <div className="flex gap-2">
                                    <select value={pago.metodo} onChange={(e) => actualizarPagoParcial(index, 'metodo', e.target.value)} className="flex-1 p-2 bg-gray-600 border border-gray-500 rounded-xl text-[11px] font-bold text-white">
                                        <option value="EFECTIVO">💵 EFECTIVO</option>
                                        <option value="YAPE">📱 YAPE / PLIN</option>
                                        <option value="TRANSFERENCIA">🏦 TRANSFERENCIA</option>
                                    </select>
                                    <div className="relative w-28">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">S/</span>
                                        <input
                                            type="number"
                                            step="0.50"
                                            value={pago.monto === 0 ? "" : pago.monto}
                                            onChange={(e) => actualizarPagoParcial(index, 'monto', Number(e.target.value))}
                                            className="w-full pl-6 p-2 bg-gray-600 border border-gray-500 rounded-xl text-xs font-bold text-white"
                                        />
                                    </div>
                                    {pagosParciales.length > 1 && (
                                        <button onClick={() => setPagosParciales(pagosParciales.filter((_, i) => i !== index))} className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* AÑADIDO: Campos de N° Operación, Fecha y Hora si no es EFECTIVO */}
                                {pago.metodo !== "EFECTIVO" && (
                                    <div className="space-y-2 mt-2">
                                        <input
                                            placeholder="N° Operación (Oblig)"
                                            value={pago.numeroOperacion}
                                            onChange={(e) => actualizarPagoParcial(index, 'numeroOperacion', e.target.value)}
                                            className="w-full p-2 bg-gray-600 border border-gray-500 rounded-xl text-[11px] font-bold text-white placeholder-gray-400"
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                value={pago.fecha}
                                                onChange={(e) => actualizarPagoParcial(index, 'fecha', e.target.value)}
                                                className="w-1/2 p-2 bg-gray-600 border border-gray-500 rounded-xl text-[11px] font-bold text-white"
                                            />
                                            <input
                                                type="time"
                                                value={pago.hora}
                                                onChange={(e) => actualizarPagoParcial(index, 'hora', e.target.value)}
                                                className="w-1/2 p-2 bg-gray-600 border border-gray-500 rounded-xl text-[11px] font-bold text-white"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        <button
                            onClick={() => setPagosParciales([...pagosParciales, {
                                metodo: "YAPE",
                                monto: saldoRestante > 0 ? saldoRestante : 0,
                                numeroOperacion: "",
                                fecha: new Date().toISOString().split('T')[0],
                                hora: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                            }])}
                            className="w-full text-[10px] font-black uppercase text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                            disabled={saldoRestante <= 0}
                        >
                            <Plus className="w-3 h-3" /> Añadir otro método
                        </button>
                    </div>

                    <div className="flex justify-between items-center bg-gray-900 p-3 rounded-xl border border-gray-700">
                        <div className="flex items-center text-gray-400">
                            <Tag className="w-4 h-4 mr-2" />
                            <span className="text-xs font-bold uppercase">Descuento (S/)</span>
                        </div>
                        <input
                            type="number"
                            min="0"
                            step="0.50"
                            value={descuentoManual === 0 ? "" : descuentoManual}
                            placeholder="0.00"
                            onChange={(e) => setDescuentoManual(Number(e.target.value))}
                            className="w-24 p-2 bg-gray-700 border border-gray-600 rounded-lg text-right text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="space-y-1 text-sm border-t border-gray-700 pt-4">
                        <div className="flex justify-between text-gray-400">
                            <span>Subtotal</span>
                            <span>S/ {subtotal.toFixed(2)}</span>
                        </div>
                        {descuentoManual > 0 && (
                            <div className="flex justify-between text-green-400">
                                <span>Descuento</span>
                                <span>- S/ {descuentoManual.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2">
                            <span className="font-black text-sm uppercase">Total</span>
                            <span className="font-black text-2xl text-blue-400">S/ {total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={procesarVenta}
                        disabled={carrito.length === 0 || !clienteSeleccionadoId || loading || Math.abs(totalPagos - total) > 0.01}
                        className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-sm shadow-xl shadow-blue-900/50 hover:bg-blue-500 disabled:bg-gray-600 disabled:shadow-none transition-all"
                    >
                        {loading ? "Procesando..." : "Cobrar"}
                    </button>
                </div>
            </div>
        </div>
    )
}