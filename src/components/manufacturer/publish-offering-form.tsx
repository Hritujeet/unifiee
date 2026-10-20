"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createOfferingAction } from "@/actions/vendor-actions"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Package,
    IndianRupee,
    Loader2,
    Sparkles,
    Truck,
    Layers,
    ArrowLeft,
} from "lucide-react"
import { toast } from "sonner"

export function PublishOfferingForm() {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)

    // Form states
    const [category, setCategory] = useState("paper_cup")
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [unitOfMeasure, setUnitOfMeasure] = useState<"piece" | "pack" | "carton" | "kg">("piece")
    const [unitPrice, setUnitPrice] = useState("4.50")
    const [minOrderQuantity, setMinOrderQuantity] = useState("1000")
    const [fulfilmentMode, setFulfilmentMode] = useState<"made_to_order" | "ready_stock">("made_to_order")
    const [leadTimeDaysMin, setLeadTimeDaysMin] = useState("5")
    const [leadTimeDaysMax, setLeadTimeDaysMax] = useState("10")
    const [material, setMaterial] = useState("")
    const [size, setSize] = useState("")
    const [city, setCity] = useState("Pune")
    const [state, setState] = useState("Maharashtra")
    const [pincode, setPincode] = useState("411001")
    const [shippingTerms, setShippingTerms] = useState<"buyer_pays" | "vendor_pays" | "included">("buyer_pays")

    const handleSubmit = async (status: "active" | "draft") => {
        if (!title.trim()) {
            toast.error("Please enter a title for your offering")
            return
        }

        const price = parseFloat(unitPrice)
        if (isNaN(price) || price <= 0) {
            toast.error("Please enter a valid unit price")
            return
        }

        const moq = parseInt(minOrderQuantity)
        if (isNaN(moq) || moq <= 0) {
            toast.error("Please enter a valid minimum order quantity")
            return
        }

        setSubmitting(true)
        try {
            const res = await createOfferingAction({
                category,
                title: title.trim(),
                description:
                    description.trim() ||
                    `${title.trim()} - High quality food & beverage packaging.`,
                unitOfMeasure,
                unitPrice: price,
                minOrderQuantity: moq,
                fulfilmentMode,
                leadTimeDaysMin: parseInt(leadTimeDaysMin) || 5,
                leadTimeDaysMax: parseInt(leadTimeDaysMax) || 10,
                shippingTerms,
                city: city.trim() || "Mumbai",
                state: state.trim() || "Maharashtra",
                pincode: pincode.trim() || "400001",
                material: material.trim(),
                size: size.trim(),
                status,
            })

            if (!res.success) {
                toast.error(res.error || "Failed to publish offering")
                return
            }

            toast.success("Offering published successfully!")
            router.push("/manufacturer/offerings")
            router.refresh()
        } catch (err: unknown) {
            console.error("Error creating offering:", err)
            toast.error("An unexpected error occurred.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6 pb-16">
            {/* Top Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                        Create Manufacturing Offering
                    </h1>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                        Publish your catalog items, standard unit economics, and fulfilment parameters.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.back()}
                        disabled={submitting}
                    >
                        <ArrowLeft className="mr-1.5 size-3.5" />
                        Back
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Section 1: Basic Specifications */}
                <Card className="shadow-xs">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                            <Package className="size-4 text-primary" />
                            General Specifications
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Primary identification and physical properties of the packaging product.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-xs font-medium">
                                    Packaging Category <span className="text-destructive">*</span>
                                </Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger id="category" className="h-9 text-xs">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="paper_cup">Paper Cups & Tumblers</SelectItem>
                                        <SelectItem value="pizza_box">Pizza Boxes & Corrugated</SelectItem>
                                        <SelectItem value="corrugated_box">Shipping Cartons & Boxes</SelectItem>
                                        <SelectItem value="food_container">Food Containers & Meal Trays</SelectItem>
                                        <SelectItem value="pouch">Pouches & Bags</SelectItem>
                                        <SelectItem value="paper_bag">Paper Carry Bags</SelectItem>
                                        <SelectItem value="cutlery">Cutlery & Wooden Ware</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-xs font-medium">
                                    Offering Title <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. 12oz Ripple Wall Kraft Coffee Cup"
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="size" className="text-xs font-medium">
                                    Size / Volume Dimensions
                                </Label>
                                <Input
                                    id="size"
                                    value={size}
                                    onChange={(e) => setSize(e.target.value)}
                                    placeholder="e.g. 12oz (350ml) or 9x9x2 inches"
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="material" className="text-xs font-medium">
                                    Material & GSM Specification
                                </Label>
                                <Input
                                    id="material"
                                    value={material}
                                    onChange={(e) => setMaterial(e.target.value)}
                                    placeholder="e.g. Virgin Poly-Coated Paperboard (300 GSM)"
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-medium">
                                Detailed Description & Features
                            </Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="Mention lid compatibility, heat retention, custom print availability, coating types..."
                                className="resize-none text-xs"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Section 2: Pricing & Minimum Limits */}
                <Card className="shadow-xs">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                            <Layers className="size-4 text-primary" />
                            Commercials & Inventory Limits
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Determine unit billing tiers and production batch sizes.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="uom" className="text-xs font-medium">
                                    Unit of Measure
                                </Label>
                                <Select
                                    value={unitOfMeasure}
                                    onValueChange={(val) =>
                                        setUnitOfMeasure(val as "piece" | "pack" | "carton" | "kg")
                                    }
                                >
                                    <SelectTrigger id="uom" className="h-9 text-xs">
                                        <SelectValue placeholder="Unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="piece">Piece (pc)</SelectItem>
                                        <SelectItem value="pack">Pack / Sleeve</SelectItem>
                                        <SelectItem value="carton">Master Carton</SelectItem>
                                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="price" className="text-xs font-medium">
                                    Base Price / Unit <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(e.target.value)}
                                        placeholder="4.50"
                                        className="h-9 pl-8 font-mono text-xs font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="moq" className="text-xs font-medium">
                                    Min Order Qty (MOQ) <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="moq"
                                        type="number"
                                        value={minOrderQuantity}
                                        onChange={(e) => setMinOrderQuantity(e.target.value)}
                                        placeholder="1000"
                                        className="h-9 pr-14 font-mono text-xs"
                                    />
                                    <span className="pointer-events-none absolute right-2.5 top-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                                        {unitOfMeasure}s
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section 3: Fulfilment & Dispatch Logistics */}
                <Card className="shadow-xs">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                            <Truck className="size-4 text-primary" />
                            Logistics & Lead Times
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Delivery expectations, manufacturing turnaround, and freight policies.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="mode" className="text-xs font-medium">
                                    Fulfilment Method
                                </Label>
                                <Select
                                    value={fulfilmentMode}
                                    onValueChange={(val) =>
                                        setFulfilmentMode(val as "made_to_order" | "ready_stock")
                                    }
                                >
                                    <SelectTrigger id="mode" className="h-9 text-xs">
                                        <SelectValue placeholder="Mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="made_to_order">
                                            Made to Order (Production Run)
                                        </SelectItem>
                                        <SelectItem value="ready_stock">
                                            Ready Stock in Warehouse
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="shipping" className="text-xs font-medium">
                                    Freight Terms
                                </Label>
                                <Select
                                    value={shippingTerms}
                                    onValueChange={(val) =>
                                        setShippingTerms(val as "buyer_pays" | "vendor_pays" | "included")
                                    }
                                >
                                    <SelectTrigger id="shipping" className="h-9 text-xs">
                                        <SelectValue placeholder="Shipping Terms" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="buyer_pays">Buyer Pays Freight</SelectItem>
                                        <SelectItem value="vendor_pays">Vendor Pays (Free Delivery)</SelectItem>
                                        <SelectItem value="included">Freight Included in Base Price</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="leadMin" className="text-xs font-medium">
                                    Min Lead Time (Days)
                                </Label>
                                <Input
                                    id="leadMin"
                                    type="number"
                                    value={leadTimeDaysMin}
                                    onChange={(e) => setLeadTimeDaysMin(e.target.value)}
                                    className="h-9 font-mono text-xs"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="leadMax" className="text-xs font-medium">
                                    Max Lead Time (Days)
                                </Label>
                                <Input
                                    id="leadMax"
                                    type="number"
                                    value={leadTimeDaysMax}
                                    onChange={(e) => setLeadTimeDaysMax(e.target.value)}
                                    className="h-9 font-mono text-xs"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="city" className="text-xs font-medium">
                                    Dispatch City
                                </Label>
                                <Input
                                    id="city"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state" className="text-xs font-medium">
                                    State
                                </Label>
                                <Input
                                    id="state"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pincode" className="text-xs font-medium">
                                    Pincode
                                </Label>
                                <Input
                                    id="pincode"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value)}
                                    className="h-9 font-mono text-xs"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sticky Bottom Actions Bar */}
            <div className="flex items-center justify-between border-t bg-background/95 pt-4 backdrop-blur-xs">
                <span className="text-xs text-muted-foreground">
                    Offerings can be archived or updated anytime.
                </span>

                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={submitting}
                        onClick={() => handleSubmit("draft")}
                        className="h-9 text-xs"
                    >
                        Save Draft
                    </Button>

                    <Button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleSubmit("active")}
                        className="h-9 gap-1.5 text-xs"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="size-3.5 animate-spin" />
                                Publishing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="size-3.5" />
                                Publish Offering
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}