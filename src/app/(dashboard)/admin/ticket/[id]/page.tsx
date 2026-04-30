import prisma from "@/lib/prisma"
import TicketWrapper from "./TicketWrapper"

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;

    const pago = await prisma.pago.findUnique({
        where: { id: resolvedParams.id },
        include: {
            cliente: true,
            estudiantes: true,
            cajero: true
        }
    })

    if (!pago || pago.estado !== 'APROBADO') {
        return (
            <div className="p-10 text-center font-bold text-red-600">
                El ticket no existe o el pago aún no está aprobado.
            </div>
        )
    }

    return <TicketWrapper pago={pago} />
}