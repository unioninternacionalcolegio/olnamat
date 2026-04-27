"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Save, Edit2, Trash2, Settings, Plus } from "lucide-react"

export default function PanelConfiguracion({ dataInicial }: { dataInicial: any[] }) {
    const router = useRouter()
    const [configuraciones, setConfiguraciones] = useState(dataInicial)
    const [loading, setLoading] = useState(false)

    // Estado del formulario
    const [form, setForm] = useState({
        id: "",
        nivel: "INICIAL",
        gradoOEdad: "3 años",
        costoRegular: 10,
        costoExtemporaneo: 15,
        cantidadPreguntas: 10,
        puntosCorrecto: 10,
        puntosIncorrecto: -1,
        puntosBlanco: 0,
        horaInicio: "09:00",
        horaFin: "10:30"
    })

    const nivelesYGrados = {
        INICIAL: ["3 años", "4 años", "5 años"],
        PRIMARIA: ["1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado"],
        SECUNDARIA: ["1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado"]
    }

    const handleChange = (e: any) => {
        setForm({ ...form, [e.target.name]: e.target.value })
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
            id: "", nivel: "INICIAL", gradoOEdad: "3 años",
            costoRegular: 10, costoExtemporaneo: 15, cantidadPreguntas: 10,
            puntosCorrecto: 10, puntosIncorrecto: -1, puntosBlanco: 0,
            horaInicio: "09:00", horaFin: "10:30"
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

            // Actualizar estado local rápido
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

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* FORMULARIO */}
            <div className="xl:col-span-1">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-6">
                    <h2 className="text-lg font-bold flex items-center mb-6 text-gray-800">
                        <Settings className="w-5 h-5 mr-2 text-blue-600" />
                        {form.id ? "Editar Configuración" : "Nueva Configuración"}
                    </h2>

                    <form onSubmit={guardarConfiguracion} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nivel</label>
                                <select name="nivel" value={form.nivel} onChange={handleNivelChange} className="w-full p-2 border rounded-lg text-sm bg-gray-50">
                                    <option value="INICIAL">INICIAL</option>
                                    <option value="PRIMARIA">PRIMARIA</option>
                                    <option value="SECUNDARIA">SECUNDARIA</option>
                                </select>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Grado / Edad</label>
                                <select name="gradoOEdad" value={form.gradoOEdad} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm bg-gray-50">
                                    {nivelesYGrados[form.nivel as keyof typeof nivelesYGrados].map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Costos */}
                            <div className="col-span-2 pt-2 border-t mt-2">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Costos (S/)</h3>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Regular</label>
                                <input type="number" step="0.50" name="costoRegular" value={form.costoRegular} onChange={handleChange} required className="w-full p-2 border rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Extemporáneo</label>
                                <input type="number" step="0.50" name="costoExtemporaneo" value={form.costoExtemporaneo} onChange={handleChange} required className="w-full p-2 border rounded-lg text-sm" />
                            </div>

                            {/* Reglas de Examen */}
                            <div className="col-span-2 pt-2 border-t mt-2">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reglas del Examen</h3>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-600 mb-1">Total Preguntas</label>
                                <input type="number" name="cantidadPreguntas" value={form.cantidadPreguntas} onChange={handleChange} required className="w-full p-2 border rounded-lg text-sm" />
                            </div>
                            <div className="col-span-2 grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-green-600 mb-1">+ Correcta</label>
                                    <input type="number" step="0.5" name="puntosCorrecto" value={form.puntosCorrecto} onChange={handleChange} required className="w-full p-2 border border-green-200 bg-green-50 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-red-600 mb-1">- Incorrecta</label>
                                    <input type="number" step="0.5" name="puntosIncorrecto" value={form.puntosIncorrecto} onChange={handleChange} required className="w-full p-2 border border-red-200 bg-red-50 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">En Blanco</label>
                                    <input type="number" step="0.5" name="puntosBlanco" value={form.puntosBlanco} onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg text-sm" />
                                </div>
                            </div>

                            {/* Horarios */}
                            <div className="col-span-2 pt-2 border-t mt-2">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Horarios</h3>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Hora Inicio</label>
                                <input type="time" name="horaInicio" value={form.horaInicio} onChange={handleChange} required className="w-full p-2 border rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Hora Fin</label>
                                <input type="time" name="horaFin" value={form.horaFin} onChange={handleChange} required className="w-full p-2 border rounded-lg text-sm" />
                            </div>
                        </div>

                        <div className="pt-4 flex space-x-2">
                            {form.id && (
                                <button type="button" onClick={limpiarForm} className="w-1/3 bg-gray-200 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-300 text-sm">
                                    Cancelar
                                </button>
                            )}
                            <button type="submit" disabled={loading} className={`flex-1 flex justify-center items-center py-2 rounded-lg font-bold text-white text-sm transition-colors ${form.id ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? "Guardando..." : form.id ? "Actualizar" : "Guardar"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* TABLA DE CONFIGURACIONES */}
            <div className="xl:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Reglas Establecidas</h3>
                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{configuraciones.length} Registros</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-white border-b">
                                <tr>
                                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Nivel / Grado</th>
                                    <th className="p-3 text-xs font-bold text-gray-500 uppercase text-center">Precio (R/E)</th>
                                    <th className="p-3 text-xs font-bold text-gray-500 uppercase text-center">Examen</th>
                                    <th className="p-3 text-xs font-bold text-gray-500 uppercase text-center">Horario</th>
                                    <th className="p-3 text-xs font-bold text-gray-500 uppercase text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {configuraciones.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">No hay configuraciones. Crea una.</td></tr>
                                ) : (
                                    configuraciones.map((conf: any) => (
                                        <tr key={conf.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-3">
                                                <p className="font-bold text-gray-800">{conf.gradoOEdad}</p>
                                                <p className="text-[10px] uppercase font-bold text-blue-500">{conf.nivel}</p>
                                            </td>
                                            <td className="p-3 text-center">
                                                <p className="font-medium text-gray-800">S/{conf.costoRegular}</p>
                                                <p className="text-[10px] text-amber-600">S/{conf.costoExtemporaneo}</p>
                                            </td>
                                            <td className="p-3 text-center">
                                                <p className="font-bold text-gray-800">{conf.cantidadPreguntas} preg.</p>
                                                <p className="text-[10px] text-gray-500">(+{conf.puntosCorrecto} / {conf.puntosIncorrecto} / {conf.puntosBlanco})</p>
                                            </td>
                                            <td className="p-3 text-center text-xs text-gray-600 font-mono">
                                                {conf.horaInicio} - {conf.horaFin}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex justify-center space-x-2">
                                                    <button onClick={() => editarConfig(conf)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => eliminarConfig(conf.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
    )
}