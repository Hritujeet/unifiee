export type PackagingUse =
    | "coffee"
    | "food"
    | "dessert"
    | "delivery"
    | "takeaway"
    | "other"

export type PackagingType =
    | "cups"
    | "boxes"
    | "bags"
    | "cutlery"
    | "containers"
    | "custom"

export type OrderWorkflowStatus =
    | "Requirement Received"
    | "Quoted"
    | "Order Confirmed"
    | "In Production"
    | "Shipped"
    | "Delivered"

export interface Requirement {
    id: string
    title: string
    packagingUse: PackagingUse
    packagingType: PackagingType
    quantity: string
    size: string
    material: string
    brandingNeeded: boolean
    deliveryLocation: string
    requiredByDate: string
    status: OrderWorkflowStatus
    createdAt: string
    quotesCount: number
    rawDescription?: string
}

export interface Quotation {
    id: string
    requirementId: string
    requirementTitle: string
    packagingType: PackagingType
    vendorName: string
    vendorLocation: string
    unitPrice: string
    totalPrice: string
    quantity: string
    productionTime: string
    deliveryEstimate: string
    status: "pending" | "accepted" | "rejected"
    receivedAt: string
}

export interface Order {
    id: string
    orderNumber: string
    requirementId: string
    requirementTitle: string
    packagingType: PackagingType
    vendorName: string
    vendorLocation: string
    quantity: string
    totalPrice: string
    status: OrderWorkflowStatus
    paid: boolean
    deliveryLocation: string
    estimatedDelivery: string
    createdAt: string
    updatedAt: string
}
