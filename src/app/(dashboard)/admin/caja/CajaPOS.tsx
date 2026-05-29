"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Printer, Trash2, Tag, Search, Building2, Plus, ChevronDown, ChevronUp, Upload, CheckCircle2, UserCircle2 } from "lucide-react"
import * as XLSX from "xlsx"

type Cliente = {
    id: string,
    name: string | null,
    dni: string | null,
    institucion: string | null,
    role: string,
    tipoColegio: string,
    celular?: string | null
}

type EstudianteEnCarrito = {
    dni: string,
    nombres: string,
    apellidos: string,
    nivel: string,
    gradoOEdad: string
}

type ItemCarrito = {
    id: string,
    nivel: string,
    gradoOEdad: string,
    cantidad: number,
    precio: number,
    tipoPrecio: string,
    tipoColegioItem: string,
    estudiantesAgrupados: EstudianteEnCarrito[]
}

type PagoParcial = {
    metodo: string,
    monto: number,
    numeroOperacion: string,
    fecha: string,
    hora: string
}

type FormularioEstudiante = {
    idLocal: string;
    dni: string;
    nombres: string;
    apellidos: string;
    nivel: string;
    gradoOEdad: string;
    errorDni?: boolean;
    tipoErrorDni?: "REGISTRADO" | "DUPLICADO"; // <--- Añadido para diferenciar el error
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

    const [pagosParciales, setPagosParciales] = useState<PagoParcial[]>([{
        metodo: "EFECTIVO",
        monto: 0,
        numeroOperacion: "",
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    }])

    const [carrito, setCarrito] = useState<ItemCarrito[]>([])
    const [loading, setLoading] = useState(false)
    const [ticketVendido, setTicketVendido] = useState<any>(null)

    const [tipoColegioActivo, setTipoColegioActivo] = useState("PARTICULAR")
    const [faseVentaActiva, setFaseVentaActiva] = useState<"REGULAR" | "EXTEMPORANEO">("REGULAR")

    const [mostrarRegistroRapido, setMostrarRegistroRapido] = useState(false)
    const [mostrarCuposRapidos, setMostrarCuposRapidos] = useState(false)
    const [descuentoManual, setDescuentoManual] = useState<number>(0)

    const [modoInscripcion, setModoInscripcion] = useState<"DELEGADO" | "LIBRE">("DELEGADO")

    const [datosGeneralesLibre, setDatosGeneralesLibre] = useState({
        celular: "", institucion: ""
    })

    const [tipoRegistro, setTipoRegistro] = useState<"NORMAL" | "SIN_DNI">("NORMAL")
    const [formularios, setFormularios] = useState<FormularioEstudiante[]>([])
    const [ultimoDniGenerado, setUltimoDniGenerado] = useState<number>(0)

    const delegados = useMemo(() => clientesList.filter(c => c && c.role === 'DELEGADO'), [clientesList])
    const colegiosUnicos = useMemo(() => {
        const set = new Set<string>()
        clientesList.forEach(c => {
            if (c && c.institucion && c.institucion.trim() !== "") {
                let instLimpia = c.institucion.toUpperCase();
                if (instLimpia.startsWith("LIBRE-")) instLimpia = instLimpia.replace("LIBRE-", "").trim();
                set.add(instLimpia)
            }
        })
        return Array.from(set).sort()
    }, [clientesList])

    const [busquedaDelegado, setBusquedaDelegado] = useState("")
    const [mostrarOpcionesDelegado, setMostrarOpcionesDelegado] = useState(false)
    const delegadosFiltrados = delegados.filter(d =>
        d.name?.toLowerCase().includes(busquedaDelegado.toLowerCase()) || d.dni?.includes(busquedaDelegado)
    )

    const clienteActual = useMemo(() => clientesList.find(c => c.id === clienteSeleccionadoId), [clienteSeleccionadoId, clientesList])

    useEffect(() => {
        if ((mostrarRegistroRapido || modoInscripcion === "LIBRE") && formularios.length === 0) {
            agregarFilaVacia()
        }
    }, [mostrarRegistroRapido, modoInscripcion])

    useEffect(() => {
        if (tipoRegistro === "SIN_DNI") {
            obtenerUltimoDni()
        }
    }, [tipoRegistro])

    const obtenerUltimoDni = async () => {
        try {
            const res = await fetch('/api/estudiantes/ultimo-dni-sin-dni')
            const data = await res.json()
            if (data.nextNum) {
                setUltimoDniGenerado(data.nextNum)
                let runningNum = data.nextNum
                setFormularios(prev => prev.map((f) => {
                    if (!f.dni.trim() || f.dni.startsWith('0000')) {
                        const generatedDni = runningNum.toString().padStart(8, '0')
                        runningNum++
                        return { ...f, dni: generatedDni, errorDni: false, tipoErrorDni: undefined }
                    }
                    return f
                }))
            }
        } catch (error) {
            console.error("Error al obtener el último DNI", error)
        }
    }

    const agregarFilaVacia = () => {
        const nuevaFila: FormularioEstudiante = {
            idLocal: Date.now().toString() + Math.random().toString(),
            dni: "",
            nombres: "",
            apellidos: "",
            nivel: "PRIMARIA",
            gradoOEdad: "1er Grado"
        }

        if (tipoRegistro === "SIN_DNI") {
            const vaciosPrevios = formularios.filter(f => !f.dni.trim() || f.dni.startsWith('0000')).length
            nuevaFila.dni = (ultimoDniGenerado + vaciosPrevios).toString().padStart(8, '0')
        }

        setFormularios([...formularios, nuevaFila])
    }

    const actualizarFila = (idLocal: string, campo: keyof FormularioEstudiante, valor: string) => {
        setFormularios(prev => prev.map(f => {
            if (f.idLocal === idLocal) {
                const updated = { ...f, [campo]: valor }
                if (campo === 'nivel') {
                    const configPorNivel = safeConfiguraciones.filter(c => c.nivel === valor)
                    if (configPorNivel.length > 0) updated.gradoOEdad = configPorNivel[0].gradoOEdad
                }
                if (campo === 'dni') {
                    updated.errorDni = false
                    updated.tipoErrorDni = undefined
                }
                return updated
            }
            return f
        }))
    }

    const eliminarFila = (idLocal: string) => {
        setFormularios(prev => prev.filter(f => f.idLocal !== idLocal))
    }

    // VALIDACIÓN ONBLUR EN VIVO
    const verificarDniFilaIndividual = async (idLocal: string, dni: string) => {
        if (!dni || dni.length < 8 || tipoRegistro === "SIN_DNI") return

        // 1. Detección Local
        const esDuplicadoLocal = formularios.some(f => f.idLocal !== idLocal && f.dni.trim() === dni.trim())
        if (esDuplicadoLocal) {
            setFormularios(prev => prev.map(f => f.idLocal === idLocal ? { ...f, errorDni: true, tipoErrorDni: "DUPLICADO" } : f))
            alert(`¡Alerta Local! El DNI ${dni} ya lo escribiste en otra fila de este formulario.`)
            return
        }

        // 2. Detección en BD
        try {
            const res = await fetch('/api/estudiantes/verificar-dnis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dnis: [dni] })
            })
            const data = await res.json()

            if (data.registrados && data.registrados.includes(dni)) {
                setFormularios(prev => prev.map(f => f.idLocal === idLocal ? { ...f, errorDni: true, tipoErrorDni: "REGISTRADO" } : f))
            }
        } catch (error) {
            console.error("Error al validar DNI individual", error)
        }
    }

    const verificarDnisDuplicados = async () => {
        const dnis = formularios.map(f => f.dni).filter(d => d && d.length >= 8 && !d.startsWith('0000'))
        if (dnis.length === 0) return true

        const duplicadosLocales = dnis.filter((item, index) => dnis.indexOf(item) !== index)
        if (duplicadosLocales.length > 0) {
            setFormularios(prev => prev.map(f => duplicadosLocales.includes(f.dni) ? { ...f, errorDni: true, tipoErrorDni: "DUPLICADO" } : f))
            alert(`Hay DNIs repetidos en los formularios locales: ${duplicadosLocales.join(', ')}`)
            return false
        }

        try {
            const res = await fetch('/api/estudiantes/verificar-dnis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dnis })
            })
            const data = await res.json()
            if (data.registrados && data.registrados.length > 0) {
                setFormularios(prev => prev.map(f => data.registrados.includes(f.dni) ? { ...f, errorDni: true, tipoErrorDni: "REGISTRADO" } : f))
                alert(`Los siguientes DNIs ya están registrados en el sistema: ${data.registrados.join(', ')}`)
                return false
            }
            return true
        } catch (error) {
            console.error(error)
            return false
        }
    }

    // EXCEL IMPORT Y VALIDACIÓN
    const procesarImportacionExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (evt) => {
            const bstr = evt.target?.result
            const wb = XLSX.read(bstr, { type: 'binary' })
            const wsname = wb.SheetNames[0]
            const ws = wb.Sheets[wsname]
            const data = XLSX.utils.sheet_to_json(ws)

            let runningNum = ultimoDniGenerado + formularios.filter(f => !f.dni.trim() || f.dni.startsWith('0000')).length

            const nuevosFormularios: FormularioEstudiante[] = data.map((row: any) => {
                let dni = row.DNI ? row.DNI.toString().trim() : ""

                if (tipoRegistro === "SIN_DNI" && !dni) {
                    dni = runningNum.toString().padStart(8, '0')
                    runningNum++
                } else if (dni) {
                    dni = dni.padStart(8, '0')
                }

                return {
                    idLocal: Date.now().toString() + Math.random().toString(),
                    dni: dni,
                    nombres: (row.NOMBRES || "").toUpperCase().trim(),
                    apellidos: (row.APELLIDOS || "").toUpperCase().trim(),
                    nivel: row.NIVEL ? row.NIVEL.toString().toUpperCase().trim() : "PRIMARIA",
                    gradoOEdad: row.GRADO ? row.GRADO.toString().trim() : "1er Grado"
                }
            })

            const listaCompleta = [...formularios, ...nuevosFormularios]

            // FILTRO 1: DUPLICADOS LOCALES DENTRO DEL EXCEL
            const dnisVistos = new Set<string>()
            const duplicadosLocales = new Set<string>()

            listaCompleta.forEach(f => {
                const dniLimpio = f.dni.trim()
                if (dniLimpio && !dniLimpio.startsWith('0000') && dniLimpio.length >= 8) {
                    if (dnisVistos.has(dniLimpio)) {
                        duplicadosLocales.add(dniLimpio)
                    } else {
                        dnisVistos.add(dniLimpio)
                    }
                }
            })

            const listaConErroresLocales = listaCompleta.map(f => {
                if (duplicadosLocales.has(f.dni.trim())) {
                    return { ...f, errorDni: true, tipoErrorDni: "DUPLICADO" } as FormularioEstudiante
                }
                return f
            })

            setFormularios(listaConErroresLocales)

            if (duplicadosLocales.size > 0) {
                alert(`¡Alerta de Excel! Se detectaron ${duplicadosLocales.size} DNIs repetidos dentro del mismo archivo/formulario (marcados en naranja).`)
            }

            // FILTRO 2: BD PARA LOS QUE NO SON DUPLICADOS LOCALES
            const dnisAValidarDB = nuevosFormularios
                .map(f => f.dni.trim())
                .filter(d => d && d.length >= 8 && !d.startsWith('0000') && !duplicadosLocales.has(d))

            if (dnisAValidarDB.length > 0) {
                try {
                    const res = await fetch('/api/estudiantes/verificar-dnis', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ dnis: dnisAValidarDB })
                    })
                    const dbData = await res.json()
                    if (dbData.registrados && dbData.registrados.length > 0) {
                        setFormularios(prev => prev.map(f =>
                            dbData.registrados.includes(f.dni.trim()) ? { ...f, errorDni: true, tipoErrorDni: "REGISTRADO" } : f
                        ))
                        alert(`¡Alerta de Base de Datos! Además, se detectaron ${dbData.registrados.length} estudiantes que ya existen registrados en el sistema (marcados en rojo).`)
                    }
                } catch (err) {
                    console.error("Error en validación automática post-excel", err)
                }
            }
        }
        reader.readAsBinaryString(file)
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

    const agregarAlCarritoMasivo = async () => {
        if (modoInscripcion === "DELEGADO" && !clienteActual) return alert("Selecciona un delegado primero.")

        const incompletos = formularios.some(f => !f.dni || !f.nombres || !f.nivel || !f.gradoOEdad)
        if (incompletos) return alert("Hay formularios incompletos. Llena todos los datos de los estudiantes.")

        // BLOQUEO EN EL BOTÓN
        const tieneErroresDni = formularios.some(f => f.errorDni)
        if (tieneErroresDni) {
            return alert("¡No puedes continuar! Hay DNIs duplicados o ya registrados en la lista (revisa los campos naranjas y rojos).")
        }

        if (modoInscripcion === "LIBRE" && !datosGeneralesLibre.institucion) {
            return alert("Falta ingresar el Colegio de procedencia.")
        }

        const validos = await verificarDnisDuplicados()
        if (!validos) return

        if (!confirm(`¿Estás seguro de agregar ${formularios.length} estudiantes al carrito?`)) return

        setLoading(true)

        try {
            let idClienteFinal = clienteSeleccionadoId

            if (modoInscripcion === "LIBRE" && !idClienteFinal) {
                let instFinal = datosGeneralesLibre.institucion.trim().toUpperCase()
                if (!instFinal.startsWith("LIBRE-")) {
                    instFinal = `LIBRE-${instFinal}`
                }

                const titular = formularios[0]

                const res = await fetch("/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        dni: titular.dni,
                        nombres: titular.nombres,
                        apellidos: titular.apellidos,
                        institucion: instFinal,
                        celular: datosGeneralesLibre.celular,
                        role: "LIBRE",
                        tipoColegio: tipoColegioActivo,
                        nivel: titular.nivel,
                        gradoOEdad: titular.gradoOEdad
                    }),
                })

                const data = await res.json()
                if (!res.ok) throw new Error(data.error)

                idClienteFinal = data.user.id
                setClienteSeleccionadoId(idClienteFinal)

                const nuevoCliente: Cliente = {
                    id: data.user.id,
                    name: `${titular.nombres} ${titular.apellidos}`.toUpperCase(),
                    dni: data.user.dni,
                    institucion: instFinal,
                    tipoColegio: tipoColegioActivo,
                    role: "LIBRE",
                    celular: datosGeneralesLibre.celular
                }
                setClientesList([...clientesList, nuevoCliente])
            }

            let carritoTemp = [...carrito]

            formularios.forEach(form => {
                const { monto, fase } = calcularPrecio(form.nivel, form.gradoOEdad, tipoColegioActivo)
                const idItem = `${form.nivel}-${form.gradoOEdad}-${tipoColegioActivo}-${fase}`

                const indexExiste = carritoTemp.findIndex(item => item.id === idItem)

                const estudianteData = {
                    dni: form.dni,
                    nombres: form.nombres,
                    apellidos: form.apellidos,
                    nivel: form.nivel,
                    gradoOEdad: form.gradoOEdad
                }

                if (indexExiste >= 0) {
                    carritoTemp[indexExiste].cantidad += 1
                    carritoTemp[indexExiste].estudiantesAgrupados.push(estudianteData)
                } else {
                    carritoTemp.push({
                        id: idItem,
                        nivel: form.nivel,
                        gradoOEdad: form.gradoOEdad,
                        cantidad: 1,
                        precio: monto,
                        tipoPrecio: fase,
                        tipoColegioItem: tipoColegioActivo,
                        estudiantesAgrupados: [estudianteData]
                    })
                }
            })

            setCarrito(carritoTemp)
            setFormularios([])
            alert("¡Estudiantes agregados al carrito correctamente!")

        } catch (error: any) {
            alert(`Error al registrar: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const agregarAlCarritoRapido = (nivel: string, grado: string) => {
        if (!clienteActual && !clienteSeleccionadoId) return alert("Selecciona un cliente/delegado primero.")

        const { monto, fase } = calcularPrecio(nivel, grado, tipoColegioActivo)
        const idItem = `${nivel}-${grado}-${tipoColegioActivo}-${fase}`
        const existe = carrito.find(item => item.id === idItem)

        if (existe) {
            setCarrito(carrito.map(item => item.id === idItem ? { ...item, cantidad: item.cantidad + 1 } : item))
        } else {
            setCarrito([...carrito, {
                id: idItem,
                nivel,
                gradoOEdad: grado,
                cantidad: 1,
                precio: monto,
                tipoPrecio: fase,
                tipoColegioItem: tipoColegioActivo,
                estudiantesAgrupados: []
            }])
        }
    }

    const eliminarItem = (id: string) => {
        setCarrito(prev => prev.filter(item => item.id !== id))
    }

    const actualizarPrecio = (id: string, nuevoPrecio: number) => {
        setCarrito(carrito.map(item => item.id === id ? { ...item, precio: nuevoPrecio } : item))
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
        if (!clienteSeleccionadoId || carrito.length === 0) return alert("Venta vacía o sin cliente seleccionado.")

        if (Math.abs(totalPagos - total) > 0.01) {
            return alert(`Los pagos parciales (S/ ${totalPagos.toFixed(2)}) no coinciden con el total (S/ ${total.toFixed(2)}).`)
        }

        for (const p of pagosParciales) {
            if (p.metodo !== "EFECTIVO" && !p.numeroOperacion.trim()) {
                return alert(`El N° de Operación es obligatorio para ${p.metodo}.`)
            }
        }

        const pagosFormateados = pagosParciales.map(p => ({
            metodo: p.metodo,
            monto: p.monto,
            numeroOperacion: p.numeroOperacion,
            fechaHoraPago: `${p.fecha}T${p.hora}`
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
            setDatosGeneralesLibre({ celular: "", institucion: "" })
            setPagosParciales([{
                metodo: "EFECTIVO", monto: 0, numeroOperacion: "",
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
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                    <button onClick={() => window.open(`/admin/ticket/${ticketVendido.id}`, '_blank')} className="flex items-center justify-center space-x-3 bg-gray-500 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition-all">
                        <Printer className="w-6 h-6" /> <span>IMPRIMIR</span>
                    </button>
                    <button onClick={() => { setTicketVendido(null); setClienteSeleccionadoId(""); setModoInscripcion("DELEGADO"); router.refresh() }} className="bg-gray-100 text-gray-700 px-8 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all">NUEVA VENTA</button>
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
                                    <button key={fase} onClick={() => setFaseVentaActiva(fase as any)}
                                        className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${faseVentaActiva === fase ? (fase === "REGULAR" ? "bg-green-600 text-white" : "bg-red-600 text-white") : "bg-gray-200 text-gray-500"}`}>
                                        {fase}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 text-center">Tipo de Colegio</label>
                            <div className="flex gap-2">
                                {["ESTATAL", "PARTICULAR", "LIBRE"].map(tipo => (
                                    <button key={tipo} onClick={() => setTipoColegioActivo(tipo)}
                                        className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${tipoColegioActivo === tipo ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 text-gray-500"}`}>
                                        {tipo}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">

                    <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
                        <button onClick={() => { setModoInscripcion("DELEGADO"); setClienteSeleccionadoId(""); setMostrarRegistroRapido(false); }} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${modoInscripcion === "DELEGADO" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}>MODO DELEGADO</button>
                        <button onClick={() => { setModoInscripcion("LIBRE"); setClienteSeleccionadoId(""); }} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${modoInscripcion === "LIBRE" ? "bg-white text-purple-600 shadow-sm" : "text-gray-500"}`}> <UserCircle2 className="w-5 h-5" /> INDEPENDIENTE (LIBRE)</button>
                    </div>

                    {modoInscripcion === "DELEGADO" && (
                        <div className="space-y-2 relative">
                            <label className="font-black text-gray-800 uppercase text-sm">Buscar Delegado</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type="text" placeholder="Escribe nombre o DNI..." className="w-full p-4 pl-12 border-2 border-gray-100 rounded-2xl font-bold bg-gray-50 focus:border-blue-500 focus:outline-none" value={busquedaDelegado}
                                    onChange={e => { setBusquedaDelegado(e.target.value); setMostrarOpcionesDelegado(true); if (e.target.value === "") setClienteSeleccionadoId(""); }}
                                    onFocus={() => setMostrarOpcionesDelegado(true)} onBlur={() => setTimeout(() => setMostrarOpcionesDelegado(false), 200)}
                                />
                            </div>
                            {mostrarOpcionesDelegado && busquedaDelegado && (
                                <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-auto">
                                    {delegadosFiltrados.map(d => (
                                        <div key={d.id} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                                            onClick={() => { setClienteSeleccionadoId(d.id); setBusquedaDelegado(`${d.name} (${d.dni})`); setMostrarOpcionesDelegado(false); setMostrarRegistroRapido(true); }}>
                                            <p className="font-bold text-sm text-gray-800">{d.name}</p>
                                            <p className="text-[10px] font-bold text-gray-500 flex items-center mt-1">
                                                <span className="text-blue-500 mr-2">{d.dni}</span>
                                                <Building2 className="w-3 h-3 mr-1" /> {d.institucion || "Sin colegio"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {modoInscripcion === "LIBRE" && !clienteSeleccionadoId && (
                        <div className="bg-purple-50 p-6 rounded-3xl border-2 border-dashed border-purple-200 space-y-4">
                            <h3 className="font-black text-purple-800 uppercase flex items-center gap-2"><Building2 className="w-5 h-5" /> Datos Generales (Alumnos sin delegado)</h3>
                            <p className="text-xs text-purple-700 font-bold mb-2">Nota: El ticket saldrá automáticamente a nombre del primer estudiante registrado en la lista de abajo.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input placeholder="CELULAR (Opcional)" value={datosGeneralesLibre.celular} onChange={e => setDatosGeneralesLibre({ ...datosGeneralesLibre, celular: e.target.value })} maxLength={9} type="tel" className="p-3 text-sm font-bold border rounded-xl bg-white" />
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-purple-600 bg-purple-100 px-2 py-1 rounded">COLEGIO</span>
                                    <input placeholder="Escribe el colegio de procedencia..." value={datosGeneralesLibre.institucion} onChange={e => setDatosGeneralesLibre({ ...datosGeneralesLibre, institucion: e.target.value })} list="colegios-list" className="w-full p-3 pl-24 text-sm font-bold border rounded-xl bg-white uppercase" />
                                    <datalist id="colegios-list">
                                        {colegiosUnicos.map(col => <option key={col} value={col} />)}
                                    </datalist>
                                </div>
                            </div>
                        </div>
                    )}

                    {(clienteSeleccionadoId && modoInscripcion === "DELEGADO" && mostrarRegistroRapido) || modoInscripcion === "LIBRE" ? (
                        <div className="bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-gray-200 mt-4 space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 border-gray-200">
                                <div>
                                    <h3 className="font-black text-gray-800 uppercase">Lista de Alumnos a Inscribir</h3>
                                </div>
                                <div className="flex gap-2 mt-2 md:mt-0 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                                    <button onClick={() => setTipoRegistro("NORMAL")} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${tipoRegistro === "NORMAL" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>NORMAL (CON DNI)</button>
                                    <button onClick={() => setTipoRegistro("SIN_DNI")} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${tipoRegistro === "SIN_DNI" ? "bg-red-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>SIN DNI</button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <label className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl cursor-pointer hover:bg-green-100 transition-colors text-xs font-black">
                                    <Upload className="w-4 h-4" /> Importar Excel
                                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={procesarImportacionExcel} />
                                </label>
                                <button onClick={agregarFilaVacia} className="text-xs font-black text-blue-600 flex items-center gap-1 hover:underline">
                                    <Plus className="w-4 h-4" /> Agregar otra fila
                                </button>
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {formularios.map((form) => {
                                    const configPorNivel = safeConfiguraciones.filter(c => c.nivel === form.nivel)
                                    return (
                                        <div key={form.idLocal} className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-white p-3 rounded-xl border shadow-sm items-center relative">
                                            <div className="md:col-span-2">
                                                <input
                                                    placeholder="DNI"
                                                    value={form.dni}
                                                    onChange={e => actualizarFila(form.idLocal, 'dni', e.target.value)}
                                                    onBlur={e => verificarDniFilaIndividual(form.idLocal, e.target.value)}
                                                    maxLength={8}
                                                    disabled={tipoRegistro === "SIN_DNI"}
                                                    className={`w-full p-2 text-xs font-bold border rounded-lg 
                                                        ${form.errorDni
                                                            ? form.tipoErrorDni === 'DUPLICADO'
                                                                ? 'border-orange-500 bg-orange-50 text-orange-600 animate-pulse'
                                                                : 'border-red-500 bg-red-50 text-red-600 animate-pulse'
                                                            : 'bg-gray-50'} 
                                                        ${tipoRegistro === "SIN_DNI" ? "text-gray-400 cursor-not-allowed" : ""}`}
                                                />
                                                {form.errorDni && (
                                                    <p className={`text-[9px] font-black mt-0.5 ml-1 leading-none absolute -bottom-3 ${form.tipoErrorDni === 'DUPLICADO' ? 'text-orange-500' : 'text-red-500'}`}>
                                                        {form.tipoErrorDni === 'DUPLICADO' ? '¡Duplicado!' : '¡Ya registrado!'}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="md:col-span-3">
                                                <input placeholder="NOMBRES" value={form.nombres} onChange={e => actualizarFila(form.idLocal, 'nombres', e.target.value)} className="w-full p-2 text-xs font-bold border rounded-lg bg-gray-50 uppercase" />
                                            </div>
                                            <div className="md:col-span-3">
                                                <input placeholder="APELLIDOS" value={form.apellidos} onChange={e => actualizarFila(form.idLocal, 'apellidos', e.target.value)} className="w-full p-2 text-xs font-bold border rounded-lg bg-gray-50 uppercase" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <select value={form.nivel} onChange={e => actualizarFila(form.idLocal, 'nivel', e.target.value)} className="w-full p-2 text-[10px] font-bold border rounded-lg bg-white uppercase">
                                                    <option value="INICIAL">INICIAL</option>
                                                    <option value="PRIMARIA">PRIMARIA</option>
                                                    <option value="SECUNDARIA">SECUNDARIA</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-1">
                                                <select value={form.gradoOEdad} onChange={e => actualizarFila(form.idLocal, 'gradoOEdad', e.target.value)} className="w-full p-2 text-[10px] font-bold border rounded-lg bg-white">
                                                    {configPorNivel.map(c => <option key={c.gradoOEdad} value={c.gradoOEdad}>{c.gradoOEdad}</option>)}
                                                </select>
                                            </div>
                                            <div className="md:col-span-1 flex justify-center">
                                                <button onClick={() => eliminarFila(form.idLocal)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {formularios.length > 0 && (
                                <button onClick={agregarAlCarritoMasivo} className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-sm shadow-lg hover:bg-blue-700 transition-all">
                                    <CheckCircle2 className="w-5 h-5" /> Agregar {formularios.length} al Carrito
                                </button>
                            )}
                        </div>
                    ) : null}
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 transition-all">
                    <div className="flex justify-between items-center cursor-pointer border-b pb-2 border-gray-100" onClick={() => setMostrarCuposRapidos(!mostrarCuposRapidos)}>
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Cupos Rápidos (Sin nombres - Solo cantidad)</h3>
                        {mostrarCuposRapidos ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                    {mostrarCuposRapidos && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                            {["INICIAL", "PRIMARIA", "SECUNDARIA"].map((nivel) => (
                                <div key={nivel} className="space-y-2">
                                    <h4 className="text-[10px] font-black text-blue-500 uppercase">{nivel}</h4>
                                    <div className="flex flex-col gap-1">
                                        {safeConfiguraciones.filter(c => c && c.nivel === nivel).map((c) => (
                                            <button key={c.id} onClick={() => agregarAlCarritoRapido(nivel, c.gradoOEdad)} className="text-left px-4 py-2 bg-gray-50 hover:bg-blue-600 hover:text-white rounded-xl text-[11px] font-bold transition-all border border-transparent hover:border-blue-600 flex justify-between">
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

            <div className="bg-white flex flex-col h-[850px] rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden sticky top-6">
                <div className="p-6 bg-gray-500 text-white flex justify-between items-center font-black text-sm uppercase">
                    <span>Carrito Resumido</span>
                    {clienteSeleccionadoId && <span className="text-[10px] bg-gray-600 px-2 py-1 rounded">Asignado</span>}
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
                                    {item.estudiantesAgrupados.length > 0 && (
                                        <div className="mt-2 pl-2 border-l-2 border-blue-200">
                                            {item.estudiantesAgrupados.map((est, idx) => (
                                                <p key={idx} className="text-[9px] text-gray-600 font-bold">👤 {est.dni} - {est.nombres}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-xs font-black bg-white border px-3 py-1 rounded-lg">Cant: {item.cantidad}</span>
                                    <button onClick={() => eliminarItem(item.id)} className="text-red-400 hover:text-red-600 text-[10px] font-bold flex items-center gap-1">
                                        <Trash2 className="w-3 h-3" /> Quitar
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-1 border-t border-gray-200 pt-2">
                                <span className="text-[10px] font-bold text-gray-400">P. Unit:</span>
                                <input type="number" step="0.50" value={item.precio} onChange={(e) => actualizarPrecio(item.id, Number(e.target.value))} className="w-16 p-1 text-xs font-bold border rounded bg-white text-right" />
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
                            <div key={index} className="space-y-2 border-b border-gray-600 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                                <div className="flex gap-2">
                                    <select value={pago.metodo} onChange={(e) => actualizarPagoParcial(index, 'metodo', e.target.value)} className="flex-1 p-2 bg-gray-600 border border-gray-500 rounded-xl text-[11px] font-bold text-white">
                                        <option value="EFECTIVO">💵 EFECTIVO</option>
                                        <option value="YAPE">📱 YAPE / PLIN</option>
                                        <option value="TRANSFERENCIA">🏦 TRANSFERENCIA</option>
                                    </select>
                                    <div className="relative w-28">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">S/</span>
                                        <input type="number" step="0.50" value={pago.monto === 0 ? "" : pago.monto} onChange={(e) => actualizarPagoParcial(index, 'monto', Number(e.target.value))} className="w-full pl-6 p-2 bg-gray-600 border border-gray-500 rounded-xl text-xs font-bold text-white" />
                                    </div>
                                </div>
                                {pago.metodo !== "EFECTIVO" && (
                                    <div className="space-y-2 mt-2">
                                        <input placeholder="N° Operación (Oblig)" value={pago.numeroOperacion} onChange={(e) => actualizarPagoParcial(index, 'numeroOperacion', e.target.value)} className="w-full p-2 bg-gray-600 border border-gray-500 rounded-xl text-[11px] font-bold text-white placeholder-gray-400" />
                                        <div className="flex gap-2">
                                            <input type="date" value={pago.fecha} onChange={(e) => actualizarPagoParcial(index, 'fecha', e.target.value)} className="w-1/2 p-2 bg-gray-600 border border-gray-500 rounded-xl text-[11px] font-bold text-white" />
                                            <input type="time" value={pago.hora} onChange={(e) => actualizarPagoParcial(index, 'hora', e.target.value)} className="w-1/2 p-2 bg-gray-600 border border-gray-500 rounded-xl text-[11px] font-bold text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button onClick={() => setPagosParciales([...pagosParciales, { metodo: "YAPE", monto: saldoRestante > 0 ? saldoRestante : 0, numeroOperacion: "", fecha: new Date().toISOString().split('T')[0], hora: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }])} className="w-full text-[10px] font-black uppercase text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 py-2 rounded-lg transition-colors flex items-center justify-center gap-1" disabled={saldoRestante <= 0}>
                            <Plus className="w-3 h-3" /> Añadir otro método
                        </button>
                    </div>

                    <div className="flex justify-between items-center bg-gray-900 p-3 rounded-xl border border-gray-700">
                        <div className="flex items-center text-gray-400"><Tag className="w-4 h-4 mr-2" /> <span className="text-xs font-bold uppercase">Desc. (S/)</span></div>
                        <input type="number" min="0" step="0.50" value={descuentoManual === 0 ? "" : descuentoManual} onChange={(e) => setDescuentoManual(Number(e.target.value))} className="w-24 p-2 bg-gray-700 border border-gray-600 rounded-lg text-right text-sm font-bold text-white focus:outline-none" />
                    </div>
                    <div className="space-y-1 text-sm border-t border-gray-700 pt-4">
                        <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>S/ {subtotal.toFixed(2)}</span></div>
                        {descuentoManual > 0 && <div className="flex justify-between text-green-400"><span>Descuento</span><span>- S/ {descuentoManual.toFixed(2)}</span></div>}
                        <div className="flex justify-between items-center pt-2">
                            <span className="font-black text-sm uppercase">Total</span>
                            <span className="font-black text-2xl text-blue-400">S/ {total.toFixed(2)}</span>
                        </div>
                    </div>
                    <button onClick={procesarVenta} disabled={carrito.length === 0 || !clienteSeleccionadoId || loading || Math.abs(totalPagos - total) > 0.01} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-sm shadow-xl shadow-blue-900/50 hover:bg-blue-500 disabled:bg-gray-600 disabled:shadow-none transition-all">
                        {loading ? "Procesando..." : "Cobrar"}
                    </button>
                </div>
            </div>
        </div>
    )
}