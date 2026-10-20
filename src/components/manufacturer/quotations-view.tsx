"use client"

import { useState } from "react"
import {
    FileSpreadsheet,
    Search,
    IndianRupee,
    Clock,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
} from "@/components/ui/card"

export interface DbQuotationItem {
    quote: {
        id: string
        quoteNumber: string
        status: string
        unitPrice: string
        totalPrice: string
        currency: string
        quantity: number
        productionLeadTimeDays: number
        estimatedDeliveryDays: number
        validUntil: Date
        notes: string | null
        createdAt: Date
    }
    requirementTitle: string | null
}

interface QuotationsViewProps {
    initialQuotations: DbQuotationItem[]
}

export function QuotationsView({ initialQuotations }: QuotationsViewProps) {
    const [quotations] = useState<DbQuotationItem[]>(initialQuotations)
    const [searchQuery, setSearchQuery] = useState("")

    const filtered = quotations.filter((item) => {
        return (
            item.quote.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.requirementTitle &&
                item.requirementTitle.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    })

    if (quotations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <FileSpreadsheet className="size-6 text-muted-foreground/60" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No quotations yet</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                    When businesses post custom packaging requirements requesting quotations, you will be able to submit commercial quotes here.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search quotations..."
                    className="pl-9 text-xs"
                />
            </div>

            <div className="space-y-3">
                {filtered.map(({ quote, requirementTitle }) => (
                    <Card key={quote.id} className="border shadow-xs">
                        <CardContent className="p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b pb-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm font-bold text-foreground">
                                            {quote.quoteNumber}
                                        </span>
                                        <Badge variant="outline" className="text-xs uppercase">
                                            {quote.status}
                                        </Badge>
                                    </div>
                                    <h4 className="font-semibold text-sm text-foreground">
                                        {requirementTitle || "Packaging Requirement"}
                                    </h4>
                                </div>

                                <div className="text-left sm:text-right">
                                    <span className="text-base font-bold text-foreground block">
                                        ₹{parseFloat(quote.unitPrice).toFixed(2)} / unit
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Quantity: {quote.quantity.toLocaleString()} units &bull; Total: ₹{parseFloat(quote.totalPrice).toLocaleString("en-IN")}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                <span>Turnaround: {quote.productionLeadTimeDays} Days (Delivery ~{quote.estimatedDeliveryDays}d)</span>
                                <span>Valid till: {new Date(quote.validUntil).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
