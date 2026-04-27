"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, User, Plus, Minus, Trash2, Printer, UserPlus } from "lucide-react"

type Cliente = { id: string, name: string | null, dni: string | null, institucion: string | null, role: string }
type ItemCarrito = { id: string, nivel: string, gradoOEdad: string, cantidad: number, precio: number }

const COSTO_EXTEMPORANEO = 15.00

export default function CajaPOS({ clientes: clientesIniciales }: { clientes: Cliente[] }) {
    const router = useRouter()
    const [clientes, setClientes] = useState<Cliente[]>(clientesIniciales)
    const [clienteSeleccionado, setClienteSeleccionado] = useState("")
    const [metodoPago, setMetodoPago] = useState("EFECTIVO")
    const [carrito, setCarrito] = useState<ItemCarrito[]>([])
    const [loading, setLoading] = useState(false)
    const [ticketVendido, setTicketVendido] = useState<any>(null)

    // Estados para Registro Rápido
    const [mostrarRegistroRapido, setMostrarRegistroRapido] = useState(false)
    const [nuevoLibre, setNuevoLibre] = useState({ dni: "", nombres: "", apellidos: "" })

    const nivelesYGrados = [
        { nivel: "INICIAL", grados: ["3 años", "4 años", "5 años"] },
        { nivel: "PRIMARIA", grados: ["1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado"] },
        { nivel: "SECUNDARIA", grados: ["1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado"] }
    ]

    const agregarAlCarrito = (nivel: string, grado: string) => {
        const idItem = `${nivel}-${grado}`
        const existe = carrito.find(item => item.id === idItem)
        if (existe) {
            setCarrito(carrito.map(item => item.id === idItem ? { ...item, cantidad: item.cantidad + 1 } : item))
        } else {
            setCarrito([...carrito, { id: idItem, nivel, gradoOEdad: grado, cantidad: 1, precio: COSTO_EXTEMPORANEO }])
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

    // AQUÍ ESTÁ LA FUNCIÓN QUE FALTABA
    const eliminarItem = (id: string) => {
        setCarrito(carrito.filter(item => item.id !== id))
    }

    const registrarYSeleccionar = async () => {
        if (!nuevoLibre.dni || !nuevoLibre.nombres) return alert("DNI y Nombres son obligatorios")
        setLoading(true)
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...nuevoLibre, role: "LIBRE" }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            // Añadir al listado local y seleccionar
            const nuevoUser = { id: data.user.id, name: data.user.name, dni: nuevoLibre.dni, institucion: null, role: "LIBRE" }
            setClientes([...clientes, nuevoUser])
            setClienteSeleccionado(data.user.id)
            setMostrarRegistroRapido(false)
            setNuevoLibre({ dni: "", nombres: "", apellidos: "" })
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    const procesarVenta = async () => {
        if (!clienteSeleccionado || carrito.length === 0) return alert("Selecciona un cliente y agrega items.")
        setLoading(true)
        try {
            const res = await fetch("/api/caja/ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clienteId: clienteSeleccionado, items: carrito, metodoPago, montoTotal: total })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setTicketVendido(data.ticket)
            setCarrito([])
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    const total = carrito.reduce((acc, item) => acc + (item.cantidad * item.precio), 0)
    const totalCupos = carrito.reduce((acc, item) => acc + item.cantidad, 0)

    if (ticketVendido) {
        return (
            <div className="bg-white p-8 rounded-xl shadow-sm text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-4xl">✓</div>
                <h2 className="text-3xl font-bold">Venta Exitosa</h2>
                <p className="text-xl font-mono bg-gray-100 px-4 py-2 rounded-lg inline-block">
                    {ticketVendido.serie}-{ticketVendido.correlativo.toString().padStart(6, '0')}
                </p>
                <div className="flex justify-center space-x-4 pt-4">
                    <button className="flex items-center space-x-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
                        <Printer className="w-5 h-5" />
                        <span>Imprimir Ticket</span>
                    </button>
                    <button onClick={() => { setTicketVendido(null); setClienteSeleccionado(""); router.refresh() }} className="text-blue-600 hover:underline px-6 py-3">Nueva Venta</button>
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* BUSCADOR DE CLIENTE O REGISTRO RÁPIDO */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                        <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                            <User className="w-4 h-4" /> <span>Seleccionar Cliente</span>
                        </label>
                        <button
                            onClick={() => setMostrarRegistroRapido(!mostrarRegistroRapido)}
                            className="text-xs flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-bold"
                        >
                            <UserPlus className="w-3 h-3" /> <span>{mostrarRegistroRapido ? "Cancelar" : "Nuevo Participante Libre"}</span>
                        </button>
                    </div>

                    {mostrarRegistroRapido ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <input
                                placeholder="DNI"
                                className="p-2 border rounded text-sm"
                                value={nuevoLibre.dni}
                                onChange={(e) => setNuevoLibre({ ...nuevoLibre, dni: e.target.value })}
                            />
                            <input
                                placeholder="Nombres"
                                className="p-2 border rounded text-sm"
                                value={nuevoLibre.nombres}
                                onChange={(e) => setNuevoLibre({ ...nuevoLibre, nombres: e.target.value })}
                            />
                            <input
                                placeholder="Apellidos"
                                className="p-2 border rounded text-sm"
                                value={nuevoLibre.apellidos}
                                onChange={(e) => setNuevoLibre({ ...nuevoLibre, apellidos: e.target.value })}
                            />
                            <button
                                onClick={registrarYSeleccionar}
                                disabled={loading}
                                className="md:col-span-3 bg-blue-600 text-white text-sm py-2 rounded font-bold hover:bg-blue-700 disabled:bg-blue-400"
                            >
                                {loading ? "Registrando..." : "Registrar y Seleccionar"}
                            </button>
                        </div>
                    ) : (
                        <select
                            value={clienteSeleccionado}
                            onChange={(e) => setClienteSeleccionado(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        >
                            <option value="">-- Buscar por Nombre o DNI --</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.name} (DNI: {c.dni}) - {c.role}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* BOTONES DE AGREGAR CUPOS */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Agregar Cupos</h3>
                    <div className="space-y-6">
                        {nivelesYGrados.map((seccion) => (
                            <div key={seccion.nivel}>
                                <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">{seccion.nivel}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {seccion.grados.map((grado) => (
                                        <button
                                            key={grado}
                                            onClick={() => agregarAlCarrito(seccion.nivel, grado)}
                                            className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-sm font-medium transition-colors border border-blue-100"
                                        >
                                            + {grado}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CARRITO Y COBRO */}
            <div className="bg-white flex flex-col h-[600px] rounded-xl shadow-sm border border-gray-100">
                <div className="p-4 border-b flex items-center space-x-2 bg-gray-50 rounded-t-xl">
                    <ShoppingCart className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">Resumen de Venta</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {carrito.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                            No hay cupos agregados
                        </div>
                    ) : (
                        carrito.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{item.gradoOEdad}</p>
                                    <p className="text-xs text-gray-500 uppercase">{item.nivel}</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center bg-white border rounded-md">
                                        <button onClick={() => actualizarCantidad(item.id, -1)} className="p-1 hover:bg-gray-100 text-gray-600"><Minus className="w-4 h-4" /></button>
                                        <span className="w-8 text-center text-sm font-medium">{item.cantidad}</span>
                                        <button onClick={() => actualizarCantidad(item.id, 1)} className="p-1 hover:bg-gray-100 text-gray-600"><Plus className="w-4 h-4" /></button>
                                    </div>
                                    <span className="text-sm font-bold w-12 text-right">S/ {item.cantidad * item.precio}</span>
                                    <button onClick={() => eliminarItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-gray-50 rounded-b-xl border-t space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Cupos:</span>
                        <span className="font-bold text-lg">{totalCupos}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total a Pagar:</span>
                        <span className="font-bold text-2xl text-blue-600">S/ {total.toFixed(2)}</span>
                    </div>

                    <select
                        value={metodoPago}
                        onChange={(e) => setMetodoPago(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-sm font-medium"
                    >
                        <option value="EFECTIVO">💵 Pago en Efectivo</option>
                        <option value="YAPE">📱 Yape / Plin</option>
                        <option value="TRANSFERENCIA">🏦 Transferencia</option>
                    </select>

                    <button
                        onClick={procesarVenta}
                        disabled={carrito.length === 0 || !clienteSeleccionado || loading}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-4 rounded-lg font-bold text-lg transition-colors shadow-sm"
                    >
                        {loading ? "Procesando..." : "Cobrar y Generar Tickets"}
                    </button>
                </div>
            </div>
        </div>
    )
}