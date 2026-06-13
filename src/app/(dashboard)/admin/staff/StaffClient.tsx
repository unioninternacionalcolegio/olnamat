"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, X, ShieldCheck, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

type StaffUser = {
    id: string
    dni: string | null
    name: string | null
    role: string
}

export default function StaffClient({ initialData }: { initialData: StaffUser[] }) {
    const router = useRouter()
    const [staff, setStaff] = useState<StaffUser[]>(initialData)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    
    // Estado del formulario
    const [formData, setFormData] = useState({ id: "", dni: "", name: "", role: "ASISTENTE", resetPassword: false })
    const [isEditing, setIsEditing] = useState(false)

    const abrirModalNuevo = () => {
        setFormData({ id: "", dni: "", name: "", role: "ASISTENTE", resetPassword: false })
        setIsEditing(false)
        setIsModalOpen(true)
    }

    const abrirModalEditar = (user: StaffUser) => {
        setFormData({ id: user.id, dni: user.dni || "", name: user.name || "", role: user.role, resetPassword: false })
        setIsEditing(true)
        setIsModalOpen(true)
    }

    const guardarUsuario = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const url = isEditing ? `/api/admin/staff/${formData.id}` : '/api/admin/staff'
            const method = isEditing ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            if (isEditing) {
                setStaff(staff.map(s => s.id === formData.id ? { ...s, dni: data.dni, name: data.name, role: data.role } : s))
            } else {
                setStaff([data, ...staff])
            }

            setIsModalOpen(false)
            router.refresh()
            alert(isEditing ? "Actualizado correctamente" : "Registrado exitosamente. La contraseña es su DNI.")
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    const eliminarUsuario = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de quitar el acceso a ${name}?`)) return
        
        try {
            const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error("Error al eliminar")
            
            setStaff(staff.filter(s => s.id !== id))
            router.refresh()
        } catch (error: any) {
            alert(error.message)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                    <span>Total activos: {staff.length}</span>
                </div>
                <button onClick={abrirModalNuevo} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-200">
                    <Plus className="w-4 h-4" /> Registrar Personal
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-black">
                            <th className="p-4 border-b border-gray-200">DNI</th>
                            <th className="p-4 border-b border-gray-200">Nombres</th>
                            <th className="p-4 border-b border-gray-200">Rol de Acceso</th>
                            <th className="p-4 border-b border-gray-200 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staff.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center font-bold text-gray-400">No hay personal registrado aún.</td>
                            </tr>
                        ) : (
                            staff.map(s => (
                                <tr key={s.id} className="hover:bg-blue-50/50 transition-colors border-b border-gray-50 last:border-0">
                                    <td className="p-4 font-bold text-gray-600 text-sm">{s.dni}</td>
                                    <td className="p-4 font-black text-gray-800 text-sm">{s.name}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-wider ${s.role === 'ASISTENTE' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {s.role}
                                        </span>
                                    </td>
                                    <td className="p-4 flex justify-center gap-2">
                                        <button onClick={() => abrirModalEditar(s)} className="p-2 bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => eliminarUsuario(s.id, s.name || "")} className="p-2 bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE REGISTRO / EDICIÓN */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-lg font-black text-gray-800 uppercase">{isEditing ? "Editar Personal" : "Nuevo Personal"}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={guardarUsuario} className="p-6 space-y-4">
                            {!isEditing && (
                                <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-xs font-bold flex gap-2 items-start">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <p>Por defecto, el <strong>DNI</strong> será la contraseña para ingresar al sistema.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">DNI (Usuario/Contraseña)</label>
                                <input required maxLength={8} pattern="\d{8}" type="text" value={formData.dni} onChange={e => setFormData({ ...formData, dni: e.target.value })} className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold focus:border-blue-500 outline-none" placeholder="Ej. 70123456" />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Nombres Completos</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })} className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold focus:border-blue-500 outline-none uppercase" placeholder="Juan Perez" />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Asignar Rol</label>
                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full p-3 border-2 border-gray-100 rounded-xl font-black text-sm focus:border-blue-500 outline-none bg-white">
                                    <option value="ASISTENTE">ASISTENTE (Acceso a Caja / Lista)</option>
                                    <option value="REVISADOR">REVISADOR (Acceso a Subir Notas)</option>
                                </select>
                            </div>

                            {isEditing && (
                                <label className="flex items-center gap-2 p-3 bg-red-50 rounded-xl cursor-pointer">
                                    <input type="checkbox" checked={formData.resetPassword} onChange={e => setFormData({ ...formData, resetPassword: e.target.checked })} className="w-4 h-4 text-red-600 rounded border-red-300 focus:ring-red-500" />
                                    <span className="text-xs font-bold text-red-700">Resetear contraseña (volverá a ser el DNI)</span>
                                </label>
                            )}

                            <button disabled={loading} type="submit" className="w-full bg-gray-900 text-white font-black uppercase text-sm py-4 rounded-xl hover:bg-black disabled:bg-gray-400 transition-colors mt-2">
                                {loading ? "Guardando..." : "Guardar Usuario"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}