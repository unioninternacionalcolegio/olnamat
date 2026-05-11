
"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Home, Users, UserPlus, CreditCard, Eye, Settings,
    LayoutDashboard, ClipboardList, LogOut, Trophy,
    ChevronDown, ChevronRight, ChevronLeft, Menu, X
} from "lucide-react"
import { signOut } from "next-auth/react"

export default function Sidebar({ userRole }: { userRole: string }) {
    const pathname = usePathname()
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
        "Inscribir Alumnos": true,
        "Resultados": true
    })
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    // Cerrar sidebar móvil al cambiar de ruta
    useEffect(() => {
        setIsMobileOpen(false)
    }, [pathname])

    const toggleMenu = (menuName: string) => {
        setOpenMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }))
    }

    const menuItems = [
        // --- RUTAS DE ADMINISTRACIÓN Y STAFF ---
        { name: "Inicio Admin", href: "/admin", icon: Home, roles: ["ADMINISTRADOR", "ASISTENTE"] },
        { name: "Lista Alumnos", href: "/admin/alumnos", icon: Users, roles: ["ADMINISTRADOR", "ASISTENTE"] },
        { name: "Validar Pagos", href: "/admin/ver-pagos", icon: Eye, roles: ["ADMINISTRADOR", "ASISTENTE"] },
        { name: "Caja / Ventas", href: "/admin/caja", icon: CreditCard, roles: ["ADMINISTRADOR", "ASISTENTE"] },
        { name: "Subir Notas", href: "/admin/notas", icon: ClipboardList, roles: ["ADMINISTRADOR", "REVISADOR"] },
        { name: "Resultados Oficiales", href: "/admin/resultados", icon: Trophy, roles: ["ADMINISTRADOR", "ASISTENTE", "REVISADOR"] },
        { name: "Configuración", href: "/admin/configuracion", icon: Settings, roles: ["ADMINISTRADOR"] },

        // --- RUTAS DE DELEGADOS Y REPRESENTANTES ---
        { name: "Mi Panel", href: "/delegado", icon: LayoutDashboard, roles: ["DELEGADO", "REPRESENTANTE_IE", "LIBRE"] },
        {
            name: "Inscribir Alumnos",
            icon: UserPlus,
            roles: ["DELEGADO", "REPRESENTANTE_IE"],
            subItems: [
                { name: "General", href: "/delegado/inscribir" },
                { name: "Nivel Inicial", href: "/delegado/inscribir/inicial" },
                { name: "Nivel Primaria", href: "/delegado/inscribir/primaria" },
                { name: "Nivel Secundaria", href: "/delegado/inscribir/secundaria" },
                { name: "Alumnos Libres", href: "/delegado/inscribir/libre" }
            ]
        },
        { name: "Mis Pagos", href: "/delegado/mis-pagos", icon: CreditCard, roles: ["DELEGADO", "REPRESENTANTE_IE", "LIBRE"] },
        {
            name: "Resultados",
            icon: Trophy,
            roles: ["DELEGADO", "REPRESENTANTE_IE"],
            subItems: [
                { name: "General", href: "/delegado/resultados" },
                { name: "Inicial", href: "/delegado/resultados/inicial" },
                { name: "Primaria", href: "/delegado/resultados/primaria" },
                { name: "Secundaria", href: "/delegado/resultados/secundaria" }
            ]
        },

        // --- RUTAS DE ALUMNO LIBRE ---
        { name: "Mi Panel", href: "/libre", icon: LayoutDashboard, roles: ["LIBRE"] },
        { name: "Resultados Oficiales", href: "/libre/resultados", icon: Trophy, roles: ["LIBRE"] },
    ]
    const filteredMenu = menuItems.filter(item => item.roles.includes(userRole))

    return (
        <>
            {/* Botón Hamburguesa - Mobile */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
                {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay Mobile */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed lg:static inset-y-0 left-0 z-50
                flex flex-col bg-white border-r shadow-xl lg:shadow-sm
                transition-all duration-300 ease-in-out
                ${isCollapsed ? "w-20" : "w-64"}
                ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}>

                {/* Header */}
                <div className="p-6 border-b flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xl">O</span>
                    </div>
                    {!isCollapsed && (
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 tracking-tighter">OLNAMAT</h1>
                            <p className="text-xs text-gray-500 capitalize mt-0.5">
                                {userRole.replace('_', ' ')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Botón Colapsar (solo desktop) */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden lg:flex absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors"
                >
                    {isCollapsed ?
                        <ChevronRight className="w-4 h-4 text-gray-500" /> :
                        <ChevronLeft className="w-4 h-4 text-gray-500" />
                    }
                </button>

                {/* Navegación */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {filteredMenu.map((item) => {
                        const isParentActive = item.href
                            ? pathname === item.href
                            : item.subItems?.some(sub => pathname === sub.href)

                        if (item.subItems) {
                            const isOpen = openMenus[item.name]

                            return (
                                <div key={item.name} className="space-y-1">
                                    <button
                                        onClick={() => toggleMenu(item.name)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group
                                            ${isParentActive
                                                ? "bg-blue-50 text-blue-700 font-semibold"
                                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={`w-5 h-5 transition-colors ${isParentActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                                            {!isCollapsed && <span>{item.name}</span>}
                                        </div>
                                        {!isCollapsed && (isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                                    </button>

                                    {isOpen && !isCollapsed && (
                                        <div className="pl-11 space-y-1 mt-1">
                                            {item.subItems.map(sub => {
                                                const isSubActive = pathname === sub.href
                                                return (
                                                    <Link
                                                        key={sub.name}
                                                        href={sub.href}
                                                        className={`block px-4 py-2.5 text-sm rounded-2xl transition-all
                                                            ${isSubActive
                                                                ? "bg-red-50 text-red-600 font-medium"
                                                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                                            }`}
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        }

                        // Link normal
                        return (
                            <Link
                                key={item.name}
                                href={item.href!}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group
                                    ${isParentActive
                                        ? "bg-red-50 text-red-600 font-semibold"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-colors ${isParentActive ? "text-red-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                                {!isCollapsed && <span>{item.name}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer - Cerrar Sesión */}
                <div className="p-4 border-t mt-auto">
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="flex w-full items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        {!isCollapsed && <span>Cerrar Sesión</span>}
                    </button>
                </div>
            </div>
        </>
    )
}