// app/(dashboard)/admin/configuracion/PanelConfiguracion.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Save, Edit2, Trash2, Settings, Clock, Building2, Ticket, PlusCircle, Landmark } from "lucide-react"

export default function PanelConfiguracion({
    dataInicial,
    cuponesIniciales = [],
    descuentosIniciales = [],
    colegiosSugeridos = []
}: {
    dataInicial: any[],
    cuponesIniciales?: any[],
    descuentosIniciales?: any[],
    colegiosSugeridos?: string[]
}) {
    const router = useRouter()

    // ================= ESTADOS: CONFIGURACIÓN DE GRADOS =================
    const [configuraciones, setConfiguraciones] = useState(dataInicial || [])
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState({
        id: "", nivel: "INICIAL", gradoOEdad: "3 años", turno: "Turno 1",
        horaInicio: "09:00", horaFin: "10:30",
        costoEstatalReg: 10, costoEstatalExt: 15,
        costoParticularReg: 12, costoParticularExt: 17,
        costoLibreReg: 15, costoLibreExt: 20,
        cantidadPreguntas: 10, puntosCorrecto: 10, puntosIncorrecto: -1, puntosBlanco: 0,
    })

    const nivelesYGrados = {
        INICIAL: ["3 años", "4 años", "5 años"],
        PRIMARIA: ["1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado"],
        SECUNDARIA: ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"]
    }

    const handleChange = (e: any) => {
        const isNumberField = ['costo', 'puntos', 'cantidad'].some(prefix => e.target.name.startsWith(prefix));
        const value = isNumberField ? parseFloat(e.target.value) || 0 : e.target.value;
        setForm({ ...form, [e.target.name]: value })
    }

    const handleNivelChange = (e: any) => {
        const nuevoNivel = e.target.value as keyof typeof nivelesYGrados
        setForm({ ...form, nivel: nuevoNivel, gradoOEdad: nivelesYGrados[nuevoNivel][0] })
    }

    const editarConfig = (conf: any) => {
        setForm(conf)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const limpiarForm = () => {
        setForm({
            id: "", nivel: "INICIAL", gradoOEdad: "3 años", turno: "Turno 1",
            horaInicio: "09:00", horaFin: "10:30",
            costoEstatalReg: 10, costoEstatalExt: 15, costoParticularReg: 12, costoParticularExt: 17,
            costoLibreReg: 15, costoLibreExt: 20,
            cantidadPreguntas: 10, puntosCorrecto: 10, puntosIncorrecto: -1, puntosBlanco: 0,
        })
    }

    const guardarConfiguracion = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch("/api/configuracion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            })
            if (!res.ok) throw new Error("Error al guardar la configuración")

            alert("Configuración guardada correctamente")
            limpiarForm()
            router.refresh()

            const data = await res.json()
            const existe = configuraciones.find((c: any) => c.id === data.resultado.id)
            if (existe) {
                setConfiguraciones(configuraciones.map((c: any) => c.id === data.resultado.id ? data.resultado : c))
            } else {
                setConfiguraciones([...configuraciones, data.resultado])
            }
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    const eliminarConfig = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar esta configuración?")) return
        try {
            const res = await fetch(`/api/configuracion/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error("Error al eliminar")
            setConfiguraciones(configuraciones.filter((c: any) => c.id !== id))
        } catch (error: any) {
            alert(error.message)
        }
    }

    // ================= ESTADOS: CUPONES DE DESCUENTO =================
    const [cupones, setCupones] = useState(cuponesIniciales)
    const [loadingCupon, setLoadingCupon] = useState(false)
    const [formCupon, setFormCupon] = useState({ id: "", codigo: "", monto: 20 })

    const generarCodigoAleatorio = () => {
        const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let codigo = '';
        for (let i = 0; i < 6; i++) {
            codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
        }
        setFormCupon({ ...formCupon, codigo })
    }

    const guardarCupon = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoadingCupon(true)
        try {
            const res = await fetch("/api/cupones", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formCupon)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Error al guardar el cupón")

            alert("Cupón guardado correctamente")
            setFormCupon({ id: "", codigo: "", monto: 20 })
            router.refresh()

            const existe = cupones.find((c: any) => c.id === data.cupon.id)
            if (existe) {
                setCupones(cupones.map((c: any) => c.id === data.cupon.id ? data.cupon : c))
            } else {
                setCupones([data.cupon, ...cupones])
            }
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoadingCupon(false)
        }
    }

    const eliminarCupon = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar este cupón? Si ya fue usado, no se podrá eliminar.")) return
        try {
            const res = await fetch(`/api/cupones/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Error al eliminar")
            setCupones(cupones.filter((c: any) => c.id !== id))
        } catch (error: any) {
            alert(error.message)
        }
    }

    // ================= ESTADOS: DESCUENTOS POR COLEGIO =================
    const [descuentos, setDescuentos] = useState(descuentosIniciales)
    const [loadingDescuento, setLoadingDescuento] = useState(false)
    const [formDescuento, setFormDescuento] = useState({ id: "", institucion: "", descuento: 2 })

    const editarDescuento = (desc: any) => {
        setFormDescuento({ id: desc.id, institucion: desc.institucion, descuento: desc.descuento })
    }

    const guardarDescuento = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoadingDescuento(true)
        try {
            const res = await fetch("/api/descuentos-colegio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formDescuento)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Error al guardar el descuento")

            alert("Descuento guardado correctamente")
            setFormDescuento({ id: "", institucion: "", descuento: 2 })
            router.refresh()

            const existe = descuentos.find((d: any) => d.id === data.descuento.id)
            if (existe) {
                setDescuentos(descuentos.map((d: any) => d.id === data.descuento.id ? data.descuento : d))
            } else {
                setDescuentos([data.descuento, ...descuentos])
            }
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoadingDescuento(false)
        }
    }

    const eliminarDescuento = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar el descuento de este colegio?")) return
        try {
            const res = await fetch(`/api/descuentos-colegio/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error("Error al eliminar")
            setDescuentos(descuentos.filter((d: any) => d.id !== id))
        } catch (error: any) {
            alert(error.message)
        }
    }

    return (
        <div className="space-y-12">

            {/* SECCIÓN 1: CONFIGURACIÓN DE GRADOS (Original intacta) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-6">
                        <h2 className="text-lg font-bold flex items-center mb-6 text-gray-800">
                            <Settings className="w-5 h-5 mr-2 text-blue-600" />
                            {form.id ? "Editar Configuración" : "Nueva Configuración"}
                        </h2>

                        <form onSubmit={guardarConfiguracion} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nivel</label>
                                    <select name="nivel" value={form.nivel} onChange={handleNivelChange} className="w-full p-2 border rounded-lg text-sm bg-gray-50 font-bold">
                                        <option value="INICIAL">INICIAL</option>
                                        <option value="PRIMARIA">PRIMARIA</option>
                                        <option value="SECUNDARIA">SECUNDARIA</option>
                                    </select>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Grado / Edad</label>
                                    <select name="gradoOEdad" value={form.gradoOEdad} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm bg-gray-50 font-bold">
                                        {nivelesYGrados[form.nivel as keyof typeof nivelesYGrados].map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-3 border-t">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center"><Clock className="w-4 h-4 mr-1" /> Turno y Horario</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-3">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Nombre del Turno</label>
                                        <input type="text" name="turno" value={form.turno} onChange={handleChange} placeholder="Ej: Turno 1" required className="w-full p-2 border rounded-lg text-sm bg-blue-50/50" />
                                    </div>
                                    <div className="col-span-3 md:col-span-1">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Inicio</label>
                                        <input type="time" name="horaInicio" value={form.horaInicio} onChange={handleChange} required className="w-full p-2 border rounded-lg text-sm" />
                                    </div>
                                    <div className="col-span-3 md:col-span-2">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Fin</label>
                                        <input type="time" name="horaFin" value={form.horaFin} onChange={handleChange} required className="w-full p-2 border rounded-lg text-sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center"><Building2 className="w-4 h-4 mr-1" /> Costos de Inscripción (S/)</h3>
                                <div className="bg-gray-50 rounded-lg border p-3 space-y-3">
                                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-gray-500 uppercase text-center border-b pb-1">
                                        <div className="text-left">Tipo Inst.</div><div>Regular</div><div>Extemporáneo</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 items-center">
                                        <label className="text-xs font-bold text-gray-700">Estatal</label>
                                        <input type="number" step="0.5" name="costoEstatalReg" value={form.costoEstatalReg} onChange={handleChange} required className="w-full p-1 border rounded text-center text-sm" />
                                        <input type="number" step="0.5" name="costoEstatalExt" value={form.costoEstatalExt} onChange={handleChange} required className="w-full p-1 border rounded text-center text-sm" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 items-center">
                                        <label className="text-xs font-bold text-gray-700">Particular</label>
                                        <input type="number" step="0.5" name="costoParticularReg" value={form.costoParticularReg} onChange={handleChange} required className="w-full p-1 border rounded text-center text-sm" />
                                        <input type="number" step="0.5" name="costoParticularExt" value={form.costoParticularExt} onChange={handleChange} required className="w-full p-1 border rounded text-center text-sm" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 items-center">
                                        <label className="text-xs font-bold text-gray-700">Libre</label>
                                        <input type="number" step="0.5" name="costoLibreReg" value={form.costoLibreReg} onChange={handleChange} required className="w-full p-1 border rounded text-center text-sm" />
                                        <input type="number" step="0.5" name="costoLibreExt" value={form.costoLibreExt} onChange={handleChange} required className="w-full p-1 border rounded text-center text-sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Reglas del Examen</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-3">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Total Preguntas</label>
                                        <input type="number" name="cantidadPreguntas" value={form.cantidadPreguntas} onChange={handleChange} required className="w-full p-2 border rounded-lg text-sm bg-purple-50/50" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-green-600 mb-1">+ Correcta</label>
                                        <input type="number" step="0.5" name="puntosCorrecto" value={form.puntosCorrecto} onChange={handleChange} required className="w-full p-2 border border-green-200 bg-green-50 rounded-lg text-sm text-center" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-red-600 mb-1">- Incorrecta</label>
                                        <input type="number" step="0.5" name="puntosIncorrecto" value={form.puntosIncorrecto} onChange={handleChange} required className="w-full p-2 border border-red-200 bg-red-50 rounded-lg text-sm text-center" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1">En Blanco</label>
                                        <input type="number" step="0.5" name="puntosBlanco" value={form.puntosBlanco} onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg text-sm text-center" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex space-x-2 border-t">
                                {form.id && (
                                    <button type="button" onClick={limpiarForm} className="w-1/3 bg-gray-200 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-300 text-sm">
                                        Cancelar
                                    </button>
                                )}
                                <button type="submit" disabled={loading} className={`flex-1 flex justify-center items-center py-3 rounded-lg font-bold text-white text-sm transition-colors ${form.id ? 'bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20'}`}>
                                    <Save className="w-5 h-5 mr-2" />
                                    {loading ? "Guardando..." : form.id ? "Actualizar Regla" : "Crear Regla"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="xl:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Grados Configurados</h3>
                            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{configuraciones.length} Registros</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-white border-b">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Nivel / Grado</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Turno y Horario</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Precios Regulares</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {configuraciones.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-gray-400">No hay configuraciones. Empieza creando una.</td></tr>
                                    ) : (
                                        configuraciones.map((conf: any) => (
                                            <tr key={conf.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4">
                                                    <p className="font-bold text-gray-800">{conf.gradoOEdad}</p>
                                                    <p className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block mt-1">{conf.nivel}</p>
                                                </td>
                                                <td className="p-4">
                                                    <p className="font-bold text-gray-700">{conf.turno}</p>
                                                    <p className="text-xs text-gray-500 flex items-center mt-1">
                                                        <Clock className="w-3 h-3 mr-1" /> {conf.horaInicio} - {conf.horaFin}
                                                    </p>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex flex-col space-y-1 text-xs">
                                                        <span className="text-gray-600"><strong>Est:</strong> S/ {conf.costoEstatalReg}</span>
                                                        <span className="text-gray-600"><strong>Par:</strong> S/ {conf.costoParticularReg}</span>
                                                        <span className="text-gray-600"><strong>Lib:</strong> S/ {conf.costoLibreReg}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex justify-center space-x-2">
                                                        <button onClick={() => editarConfig(conf)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                        <button onClick={() => eliminarConfig(conf.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <hr className="border-gray-200" />

            {/* SECCIÓN 2: GESTIÓN DE CUPONES DE DESCUENTO (Original intacta) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-6">
                        <h2 className="text-lg font-bold flex items-center mb-6 text-gray-800">
                            <Ticket className="w-5 h-5 mr-2 text-green-600" />
                            Generar Cupón Único
                        </h2>

                        <form onSubmit={guardarCupon} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código del Cupón</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formCupon.codigo}
                                        onChange={(e) => setFormCupon({ ...formCupon, codigo: e.target.value.toUpperCase() })}
                                        placeholder="Ej: OLNA50"
                                        required
                                        maxLength={10}
                                        className="w-full p-2 border rounded-lg text-sm uppercase font-black tracking-widest text-gray-800 bg-gray-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={generarCodigoAleatorio}
                                        title="Generar al azar"
                                        className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto a Descontar (S/)</label>
                                <input
                                    type="number"
                                    step="5"
                                    min="5"
                                    value={formCupon.monto}
                                    onChange={(e) => setFormCupon({ ...formCupon, monto: parseFloat(e.target.value) || 0 })}
                                    required
                                    className="w-full p-2 border rounded-lg text-sm bg-green-50 text-green-800 font-bold"
                                />
                            </div>

                            <button type="submit" disabled={loadingCupon} className="w-full flex justify-center items-center py-3 rounded-lg font-bold text-white text-sm transition-colors bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/20 mt-4">
                                <PlusCircle className="w-5 h-5 mr-2" />
                                {loadingCupon ? "Generando..." : "Crear Cupón"}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="xl:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Cupones Existentes</h3>
                            <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">{cupones.length} Registros</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-white border-b">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Código</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Valor</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Estado</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {cupones.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-gray-400">No hay cupones generados.</td></tr>
                                    ) : (
                                        cupones.map((c: any) => (
                                            <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${c.usado ? 'opacity-50' : ''}`}>
                                                <td className="p-4">
                                                    <span className="font-black tracking-widest text-gray-800 bg-gray-100 px-3 py-1 rounded border border-dashed border-gray-300">
                                                        {c.codigo}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-bold text-green-600">
                                                    S/ {c.monto.toFixed(2)}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${c.usado ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                        {c.usado ? 'YA USADO' : 'DISPONIBLE'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => eliminarCupon(c.id)}
                                                        disabled={c.usado}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:text-gray-300 disabled:hover:bg-transparent"
                                                        title={c.usado ? "No se puede eliminar un cupón ya usado" : "Eliminar cupón"}
                                                    >
                                                        <Trash2 className="w-4 h-4 mx-auto" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <hr className="border-gray-200" />

            {/* 💉 NUEVO: SECCIÓN 3: DESCUENTOS POR COLEGIO */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-12">
                <div className="xl:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-6">
                        <h2 className="text-lg font-bold flex items-center mb-6 text-gray-800">
                            <Landmark className="w-5 h-5 mr-2 text-purple-600" />
                            {formDescuento.id ? "Editar Descuento" : "Descuento por Colegio"}
                        </h2>

                        <form onSubmit={guardarDescuento} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Institución (Colegio)</label>
                                <input
                                    type="text"
                                    list="lista-colegios"
                                    value={formDescuento.institucion}
                                    onChange={(e) => setFormDescuento({ ...formDescuento, institucion: e.target.value.toUpperCase() })}
                                    placeholder="Ej: D UNI"
                                    required
                                    className="w-full p-2 border rounded-lg text-sm uppercase font-bold text-gray-800 bg-gray-50 focus:border-purple-500 focus:outline-none"
                                />
                                <datalist id="lista-colegios">
                                    {colegiosSugeridos.map(col => (
                                        <option key={col} value={col} />
                                    ))}
                                </datalist>
                                <p className="text-[10px] text-gray-400 mt-1">Selecciona uno de la lista o escribe un nombre nuevo.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descuento por Inscrito (S/)</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    value={formDescuento.descuento}
                                    onChange={(e) => setFormDescuento({ ...formDescuento, descuento: parseFloat(e.target.value) || 0 })}
                                    required
                                    className="w-full p-2 border rounded-lg text-sm bg-purple-50 text-purple-800 font-bold focus:border-purple-500 focus:outline-none"
                                />
                            </div>

                            <div className="pt-4 flex space-x-2 border-t">
                                {formDescuento.id && (
                                    <button type="button" onClick={() => setFormDescuento({ id: "", institucion: "", descuento: 2 })} className="w-1/3 bg-gray-200 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-300 text-sm">
                                        Cancelar
                                    </button>
                                )}
                                <button type="submit" disabled={loadingDescuento} className={`flex-1 flex justify-center items-center py-3 rounded-lg font-bold text-white text-sm transition-colors ${formDescuento.id ? 'bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20' : 'bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20'} mt-4`}>
                                    <Save className="w-5 h-5 mr-2" />
                                    {loadingDescuento ? "Guardando..." : formDescuento.id ? "Actualizar Descuento" : "Asignar Descuento"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="xl:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Colegios con Descuento</h3>
                            <span className="text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">{descuentos.length} Registros</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-white border-b">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Institución</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Descuento / Alumno</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {descuentos.length === 0 ? (
                                        <tr><td colSpan={3} className="p-8 text-center text-gray-400">No hay descuentos por colegio configurados.</td></tr>
                                    ) : (
                                        descuentos.map((desc: any) => (
                                            <tr key={desc.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4">
                                                    <span className="font-bold text-gray-800 flex items-center">
                                                        <Building2 className="w-4 h-4 mr-2 text-purple-500" />
                                                        {desc.institucion}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-black text-purple-600">
                                                    - S/ {desc.descuento.toFixed(2)}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex justify-center space-x-2">
                                                        <button onClick={() => editarDescuento(desc)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => eliminarDescuento(desc.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}