import { Check } from "lucide-react"
import { ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE, type OrderStatus } from "@/lib/orders/lifecycle"

export function OrderStepper({ status }: { status: OrderStatus }) {
    const current = ORDER_STATUS_SEQUENCE.indexOf(status)
    const terminal = status === "cancelled" || status === "rejected"
    return (
        <div className="grid gap-2 sm:flex sm:items-center sm:gap-0">
            {ORDER_STATUS_SEQUENCE.map((step, index) => {
                const done = !terminal && index < current
                const active = !terminal && index === current
                return (
                    <div key={step} className="flex items-center sm:flex-1">
                        <div className="flex items-center gap-2 text-xs">
                            <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${done || active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
                                {done ? <Check className="size-3.5" /> : index + 1}
                            </span>
                            <span className={active ? "font-semibold text-foreground" : "text-muted-foreground"}>{ORDER_STATUS_LABELS[step]}</span>
                        </div>
                        {index < ORDER_STATUS_SEQUENCE.length - 1 && <span className="mx-2 hidden h-px flex-1 bg-border sm:block" />}
                    </div>
                )
            })}
        </div>
    )
}
