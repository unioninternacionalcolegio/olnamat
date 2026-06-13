import prisma from "@/lib/prisma";
import StaffClient from "./StaffClient";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
    const staff = await prisma.user.findMany({
        where: {
            role: { in: [Role.ASISTENTE, Role.REVISADOR] }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-black mb-2 text-gray-800 uppercase tracking-tight">Gestión de Personal</h1>
            <p className="text-gray-500 font-bold mb-6 text-sm">Administra los accesos de tus Asistentes (Caja) y Revisadores (Notas).</p>
            
            <StaffClient initialData={staff} />
        </div>
    );
}