import type { OrderShipment } from "@/lib/db/schema/vendor-fulfillment"

export function ShipmentCard({ shipment }: { shipment: OrderShipment | null }) {
    if (!shipment) return <p className="text-sm text-muted-foreground">Shipment details will appear after dispatch.</p>
    return (
        <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Courier:</span> {shipment.courierPartner}</p>
            <p><span className="text-muted-foreground">Tracking:</span> {shipment.trackingUrl ? <a className="text-primary underline" href={shipment.trackingUrl} target="_blank" rel="noreferrer">{shipment.trackingNumber}</a> : shipment.trackingNumber}</p>
            <p><span className="text-muted-foreground">Status:</span> {shipment.status.replaceAll("_", " ")}</p>
            {shipment.estimatedDeliveryDate && <p><span className="text-muted-foreground">Estimated delivery:</span> {new Date(shipment.estimatedDeliveryDate).toLocaleDateString("en-IN")}</p>}
        </div>
    )
}
