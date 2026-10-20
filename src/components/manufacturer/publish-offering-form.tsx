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
    CheckCircle2,
    Truck,
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
                description: description.trim() || `${title.trim()} - high quality food & beverage packaging.`,
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

            toast.success("Offering published to database successfully!")
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
        <div className="max-w-2xl mx-auto space-y-6">
            <Card className="border shadow-xs">
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Package className="size-4 text-primary" />
                        Offering Details
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Specify what you manufacture, your pricing, and minimum order limits.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="font-semibold text-foreground">Packaging Category *</label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="w-full text-xs">
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

                        <div className="space-y-1.5">
                            <label className="font-semibold text-foreground">Listing Title *</label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. 12oz Ripple Wall Kraft Coffee Cup"
                                className="text-xs"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="font-semibold text-foreground">Product Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Describe paper thickness, strength, lid compatibility, or print options..."
                            className="text-xs"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
                        <div className="space-y-1.5">
                            <label className="font-semibold text-foreground">Unit of Measure</label>
                            <Select
                                value={unitOfMeasure}
                                onValueChange={(val) => setUnitOfMeasure(val as "piece" | "pack" | "carton" | "kg")}
                            >
                                <SelectTrigger className="w-full text-xs">
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

                        <div className="space-y-1.5">
                            <label className="font-semibold text-foreground">Base Unit Price (₹) *</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={unitPrice}
                                onChange={(e) => setUnitPrice(e.target.value)}
                                placeholder="4.50"
                                className="font-mono text-xs font-semibold"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-semibold text-foreground">Min Order Qty (MOQ) *</label>
                            <Input
                                type="number"
                                value={minOrderQuantity}
                                onChange={(e) => setMinOrderQuantity(e.target.value)}
                                placeholder="1000"
                                className="font-mono text-xs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="font-semibold text-foreground">Fulfilment Mode</label>
                            <Select
                                value={fulfilmentMode}
                                onValueChange={(val) => setFulfilmentMode(val as "made_to_order" | "ready_stock")}
                            >
                                <SelectTrigger className="w-full text-xs">
                                    <SelectValue placeholder="Mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="made_to_order">Made to Order (Production Run)</SelectItem>
                                    <SelectItem value="ready_stock">Ready Stock in Warehouse</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-semibold text-foreground">Shipping Freight Terms</label>
                            <Select
                                value={shippingTerms}
                                onValueChange={(val) => setShippingTerms(val as "buyer_pays" | "vendor_pays" | "included")}
                            >
                                <SelectTrigger className="w-full text-xs">
                                    <SelectValue placeholder="Shipping Terms" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="buyer_pays">Buyer Pays Freight</SelectItem>
                                    <SelectItem value="vendor_pays">Vendor Pays (Free Delivery)</SelectItem>
                                    <SelectItem value="included">Freight Included in Price</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                        <div className="space-y-1.5">
                            <label className="font-semibold text-foreground">Size / Dimensions</label>
                            <Input
                                value={size}
                                onChange={(e) => setSize(e.target.value)}
                                placeholder="e.g. 12oz (350ml) or 9x9x2 inches"
                                className="text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-semibold text-foreground">Material / Board Specification</label>
                            <Input
                                value={material}
                                onChange={(e) => setMaterial(e.target.value)}
                                placeholder="e.g. Virgin Poly-Coated Paperboard (300 GSM)"
                                className="text-xs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="font-semibold text-foreground">Min Lead Time (Days)</label>
                            <Input
                                type="number"
                                value={leadTimeDaysMin}
                                onChange={(e) => setLeadTimeDaysMin(e.target.value)}
                                className="font-mono text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-semibold text-foreground">Max Lead Time (Days)</label>
                            <Input
                                type="number"
                                value={leadTimeDaysMax}
                                onChange={(e) => setLeadTimeDaysMax(e.target.value)}
                                className="font-mono text-xs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 border-t pt-4">
                        <div className="space-y-1.5">
                            <label className="font-semibold text-foreground">Dispatch City</label>
                            <Input
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="text-xs"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="font-semibold text-foreground">State</label>
                            <Input
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                className="text-xs"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="font-semibold text-foreground">Pincode</label>
                            <Input
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value)}
                                className="font-mono text-xs"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    disabled={submitting}
                    onClick={() => handleSubmit("draft")}
                    className="text-xs"
                >
                    Save Draft
                </Button>
                <Button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSubmit("active")}
                    className="gap-1.5 text-xs"
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
    )
}
