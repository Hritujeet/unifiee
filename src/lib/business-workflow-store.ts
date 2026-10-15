import { create } from "zustand"
import { persist } from "zustand/middleware"

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

export const WORKFLOW_STAGES: OrderWorkflowStatus[] = [
    "Requirement Received",
    "Quoted",
    "Order Confirmed",
    "In Production",
    "Shipped",
    "Delivered",
]

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

export type PaymentWorkflowStatus = "Pending" | "Payment Initiated" | "Paid" | "Refunded"

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
    paid: boolean // Backwards-compatible flag: true when paymentStatus === "Paid"
    paymentStatus?: PaymentWorkflowStatus
    deliveryLocation: string
    estimatedDelivery: string
    createdAt: string
    updatedAt: string
}

interface WorkflowState {
    requirements: Requirement[]
    quotations: Quotation[]
    orders: Order[]

    // Actions
    addRequirement: (req: Omit<Requirement, "id" | "createdAt" | "quotesCount" | "status">) => Requirement
    acceptQuote: (quoteId: string) => void
    updateOrderStatus: (orderId: string, status: OrderWorkflowStatus) => void
    toggleOrderPaid: (orderId: string) => void
    setOrderPaymentStatus: (orderId: string, status: PaymentWorkflowStatus) => void
    resetToDemoData: () => void
}

const INITIAL_REQUIREMENTS: Requirement[] = [
    {
        id: "req-1",
        title: "Pizza box 12 in",
        packagingUse: "food",
        packagingType: "boxes",
        quantity: "1,000 units",
        size: "12 x 12 x 2 inches",
        material: "3-ply Recycled Kraft (E-Flute)",
        brandingNeeded: true,
        deliveryLocation: "Bandra West, Mumbai, MH",
        requiredByDate: "In 14 days",
        status: "Quoted",
        createdAt: "2 days ago",
        quotesCount: 3,
        rawDescription: "Need 1,000 matte black 12-inch corrugated pizza boxes with 2-color brand logo for artisanal takeaway pizza.",
    },
    {
        id: "req-2",
        title: "Paper cups 8 oz",
        packagingUse: "coffee",
        packagingType: "cups",
        quantity: "5,000 units",
        size: "8 oz (80mm rim)",
        material: "Food-grade double-wall board (280 GSM)",
        brandingNeeded: true,
        deliveryLocation: "Indiranagar, Bengaluru, KA",
        requiredByDate: "In 10 days",
        status: "Order Confirmed",
        createdAt: "5 days ago",
        quotesCount: 1,
        rawDescription: "5,000 custom double-wall paper coffee cups 8 oz with brand logo for specialty cafe espresso bar.",
    },
]

const INITIAL_QUOTES: Quotation[] = [
    {
        id: "quo-1",
        requirementId: "req-1",
        requirementTitle: "Pizza box 12 in",
        packagingType: "boxes",
        vendorName: "Delta Eco Packs",
        vendorLocation: "Bhiwandi, Maharashtra",
        unitPrice: "₹17.20",
        totalPrice: "₹17,200",
        quantity: "1,000 units",
        productionTime: "8–10 days",
        deliveryEstimate: "12–14 days",
        status: "pending",
        receivedAt: "2 hours ago",
    },
    {
        id: "quo-2",
        requirementId: "req-1",
        requirementTitle: "Pizza box 12 in",
        packagingType: "boxes",
        vendorName: "Apex Packaging Ltd.",
        vendorLocation: "Okhla, New Delhi",
        unitPrice: "₹18.00",
        totalPrice: "₹18,000",
        quantity: "1,000 units",
        productionTime: "6–7 days",
        deliveryEstimate: "8–10 days",
        status: "pending",
        receivedAt: "4 hours ago",
    },
    {
        id: "quo-3",
        requirementId: "req-1",
        requirementTitle: "Pizza box 12 in",
        packagingType: "boxes",
        vendorName: "BoxKraft Industries",
        vendorLocation: "Surat, Gujarat",
        unitPrice: "₹19.50",
        totalPrice: "₹19,500",
        quantity: "1,000 units",
        productionTime: "5–6 days",
        deliveryEstimate: "6–7 days",
        status: "pending",
        receivedAt: "1 day ago",
    },
    {
        id: "quo-4",
        requirementId: "req-2",
        requirementTitle: "Paper cups 8 oz",
        packagingType: "cups",
        vendorName: "GreenCup Solutions",
        vendorLocation: "Bengaluru, Karnataka",
        unitPrice: "₹2.40",
        totalPrice: "₹12,000",
        quantity: "5,000 units",
        productionTime: "10 days",
        deliveryEstimate: "15 days",
        status: "accepted",
        receivedAt: "4 days ago",
    },
]

const INITIAL_ORDERS: Order[] = [
    {
        id: "ord-1",
        orderNumber: "UNF-8041",
        requirementId: "req-2",
        requirementTitle: "Paper cups 8 oz",
        packagingType: "cups",
        vendorName: "GreenCup Solutions",
        vendorLocation: "Bengaluru, Karnataka",
        quantity: "5,000 units",
        totalPrice: "₹12,000",
        status: "Order Confirmed",
        paid: true,
        paymentStatus: "Paid",
        deliveryLocation: "Indiranagar, Bengaluru, KA",
        estimatedDelivery: "In 6 days",
        createdAt: "4 days ago",
        updatedAt: "2 hours ago",
    },
]

// Single source of truth selector helpers (Phase 1 Item 1)
export const selectPendingOffersCount = (quotations: Quotation[]): number =>
    quotations.filter((q) => q.status === "pending").length

export const selectPendingOffersForRequirement = (
    quotations: Quotation[],
    requirementId: string
): Quotation[] =>
    quotations.filter((q) => q.requirementId === requirementId && q.status === "pending")

export const selectAcceptedOfferForRequirement = (
    quotations: Quotation[],
    requirementId: string
): Quotation | undefined =>
    quotations.find((q) => q.requirementId === requirementId && q.status === "accepted")

export const useWorkflowStore = create<WorkflowState>()(
    persist(
        (set, get) => ({
            requirements: INITIAL_REQUIREMENTS,
            quotations: INITIAL_QUOTES,
            orders: INITIAL_ORDERS,

            addRequirement: (reqData) => {
                const newId = `req-${Date.now()}`
                const newReq: Requirement = {
                    ...reqData,
                    id: newId,
                    status: "Requirement Received",
                    createdAt: "Just now",
                    quotesCount: 0,
                }

                // Simulate broadcast quote received after a short delay for realistic demo
                setTimeout(() => {
                    const sampleQuote: Quotation = {
                        id: `quo-${Date.now()}`,
                        requirementId: newId,
                        requirementTitle: newReq.title,
                        packagingType: newReq.packagingType,
                        vendorName: "Delta Eco Packs",
                        vendorLocation: "Bhiwandi, Maharashtra",
                        unitPrice: "₹16.80",
                        totalPrice: "₹16,800",
                        quantity: newReq.quantity,
                        productionTime: "7–8 days",
                        deliveryEstimate: "10–12 days",
                        status: "pending",
                        receivedAt: "Just now",
                    }

                    set((state) => ({
                        requirements: state.requirements.map((r) =>
                            r.id === newId ? { ...r, status: "Quoted", quotesCount: 1 } : r
                        ),
                        quotations: [sampleQuote, ...state.quotations],
                    }))
                }, 1500)

                set((state) => ({
                    requirements: [newReq, ...state.requirements],
                }))

                return newReq
            },

            acceptQuote: (quoteId) => {
                const quote = get().quotations.find((q) => q.id === quoteId)
                if (!quote) return

                const newOrderNumber = `UNF-${Math.floor(1000 + Math.random() * 9000)}`
                const targetReq = get().requirements.find((r) => r.id === quote.requirementId)

                const newOrder: Order = {
                    id: `ord-${Date.now()}`,
                    orderNumber: newOrderNumber,
                    requirementId: quote.requirementId,
                    requirementTitle: quote.requirementTitle,
                    packagingType: quote.packagingType,
                    vendorName: quote.vendorName,
                    vendorLocation: quote.vendorLocation,
                    quantity: quote.quantity,
                    totalPrice: quote.totalPrice,
                    status: "Order Confirmed",
                    paid: false,
                    paymentStatus: "Pending",
                    deliveryLocation: targetReq?.deliveryLocation || "Client Registered Address",
                    estimatedDelivery: quote.deliveryEstimate,
                    createdAt: "Just now",
                    updatedAt: "Just now",
                }

                set((state) => ({
                    // Mark selected quote accepted, reject other pending quotes for this requirement
                    quotations: state.quotations.map((q) => {
                        if (q.id === quoteId) return { ...q, status: "accepted" as const }
                        if (q.requirementId === quote.requirementId && q.status === "pending") {
                            return { ...q, status: "rejected" as const }
                        }
                        return q
                    }),
                    // Update requirement status to "Order Confirmed"
                    requirements: state.requirements.map((r) =>
                        r.id === quote.requirementId ? { ...r, status: "Order Confirmed" as const } : r
                    ),
                    // Add new Order in Order Confirmed state
                    orders: [newOrder, ...state.orders],
                }))
            },

            updateOrderStatus: (orderId, newStatus) => {
                set((state) => ({
                    orders: state.orders.map((o) =>
                        o.id === orderId ? { ...o, status: newStatus, updatedAt: "Just now" } : o
                    ),
                    requirements: state.requirements.map((r) => {
                        const relatedOrder = state.orders.find((o) => o.id === orderId)
                        if (relatedOrder && r.id === relatedOrder.requirementId) {
                            return { ...r, status: newStatus }
                        }
                        return r
                    }),
                }))
            },

            setOrderPaymentStatus: (orderId, newPaymentStatus) => {
                set((state) => ({
                    orders: state.orders.map((o) =>
                        o.id === orderId
                            ? {
                                  ...o,
                                  paymentStatus: newPaymentStatus,
                                  paid: newPaymentStatus === "Paid",
                                  updatedAt: "Just now",
                              }
                            : o
                    ),
                }))
            },

            toggleOrderPaid: (orderId) => {
                const statuses: PaymentWorkflowStatus[] = ["Pending", "Payment Initiated", "Paid", "Refunded"]
                set((state) => ({
                    orders: state.orders.map((o) => {
                        if (o.id !== orderId) return o
                        const currentStatus = o.paymentStatus || (o.paid ? "Paid" : "Pending")
                        const currentIndex = statuses.indexOf(currentStatus)
                        const nextStatus = statuses[(currentIndex + 1) % statuses.length]
                        return {
                            ...o,
                            paymentStatus: nextStatus,
                            paid: nextStatus === "Paid",
                            updatedAt: "Just now",
                        }
                    }),
                }))
            },

            resetToDemoData: () => {
                set({
                    requirements: INITIAL_REQUIREMENTS,
                    quotations: INITIAL_QUOTES,
                    orders: INITIAL_ORDERS,
                })
            },
        }),
        {
            name: "unifiee-client-workflow-store",
        }
    )
)

export default useWorkflowStore

