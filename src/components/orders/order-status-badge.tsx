import { Badge } from "@/components/ui/badge"
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders/lifecycle"

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
    return (
        <Badge variant="outline" className={ORDER_STATUS_COLORS[status]}>
            {ORDER_STATUS_LABELS[status]}
        </Badge>
    )
}
