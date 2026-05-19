//app/(dashboard)/admin/ticket/[id]/TicketWrapper.tsx
"use client"

import TicketClient from "./TicketClient"

export default function TicketWrapper({ pago }: { pago: any }) {
    return <TicketClient pago={pago} />
}