"use client"

import { useState } from "react"
import { PlusCircle, Trash2, ChevronDown, ChevronUp, PackageOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
    FieldSet,
    FieldLegend,
    FieldGroup,
    Field,
    FieldLabel,
    FieldDescription,
    FieldError,
} from "@/components/ui/field"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import type { QuotationLineItem } from "@/lib/db/schema/quotation"

// ─── Derived from QUOTATION_CURRENCY enum ────────────────────────────────────
const CURRENCIES = ["INR", "USD", "EUR"] as const
type Currency = typeof CURRENCIES[number]

// ─── Derived from vendor.ts VENDOR_TYPE + common packaging units ──────────────
const UNITS = ["pcs", "kg", "g", "sets", "boxes", "rolls", "sheets", "bags", "litres", "metres"]

// ─── Types ────────────────────────────────────────────────────────────────────
interface LineItemDraft extends QuotationLineItem {
    _key: number
}

interface FormErrors {
    orderRef?: string
    currency?: string
    validUntil?: string
    lineItems?: string
    notes?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
let _keyCounter = 0
function makeItem(): LineItemDraft {
    return { _key: ++_keyCounter, name: "", description: "", qty: 1, unit: "pcs", unitPrice: 0 }
}

function formatTotal(items: LineItemDraft[], currency: Currency) {
    const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(total)
}

function validate(
    orderRef: string,
    currency: string,
    validUntil: string,
    items: LineItemDraft[],
): FormErrors {
    const errors: FormErrors = {}
    if (!orderRef.trim()) errors.orderRef = "Order reference is required."
    if (!currency) errors.currency = "Please select a currency."
    if (!validUntil) {
        errors.validUntil = "Validity date is required."
    } else if (new Date(validUntil) <= new Date()) {
        errors.validUntil = "Valid until must be a future date."
    }
    if (items.length === 0) {
        errors.lineItems = "Add at least one line item."
    } else {
        const bad = items.find(i => !i.name.trim() || i.qty <= 0 || i.unitPrice <= 0)
        if (bad) errors.lineItems = "All line items must have a name, quantity > 0, and unit price > 0."
    }
    return errors
}

// ─── Component ────────────────────────────────────────────────────────────────
export function SubmitQuotationForm() {
    const [orderRef, setOrderRef] = useState("")
    const [currency, setCurrency] = useState<Currency>("INR")
    const [validUntil, setValidUntil] = useState("")
    const [notes, setNotes] = useState("")
    const [items, setItems] = useState<LineItemDraft[]>([makeItem()])
    const [errors, setErrors] = useState<FormErrors>({})
    const [submitting, setSubmitting] = useState(false)
    const [expanded, setExpanded] = useState<Set<number>>(new Set())

    // ─ item helpers ─
    const updateItem = (key: number, patch: Partial<LineItemDraft>) =>
        setItems(prev => prev.map(i => i._key === key ? { ...i, ...patch } : i))

    const removeItem = (key: number) =>
        setItems(prev => prev.filter(i => i._key !== key))

    const addItem = () => {
        const item = makeItem()
        setItems(prev => [...prev, item])
        setExpanded(prev => new Set(prev).add(item._key))
    }

    const toggleExpand = (key: number) =>
        setExpanded(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key); else next.add(key)
            return next
        })

    // ─ submit ─
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const errs = validate(orderRef, currency, validUntil, items)
        if (Object.keys(errs).length) { setErrors(errs); return }
        setErrors({})
        setSubmitting(true)

        // TODO: call server action / API route
        await new Promise(r => setTimeout(r, 900))
        setSubmitting(false)
        toast.success("Quotation submitted successfully!")

        // Reset
        setOrderRef(""); setCurrency("INR"); setValidUntil(""); setNotes("")
        setItems([makeItem()])
    }

    const total = formatTotal(items, currency)

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-8">

            {/* ── Section 1 — Order details ── */}
            <FieldSet>
                <FieldLegend>Order Details</FieldLegend>
                <FieldDescription>
                    Specify which order you are quoting against and the currency for this quotation.
                </FieldDescription>

                <FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="orderRef">Order Reference *</FieldLabel>
                        <Input
                            id="orderRef"
                            placeholder="e.g. ORD-5512"
                            value={orderRef}
                            onChange={e => setOrderRef(e.target.value)}
                            aria-invalid={!!errors.orderRef}
                        />
                        <FieldDescription>
                            Enter the order ID shared by the business.
                        </FieldDescription>
                        <FieldError errors={errors.orderRef ? [{ message: errors.orderRef }] : []} />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field>
                            <FieldLabel htmlFor="currency">Currency *</FieldLabel>
                            <Select value={currency} onValueChange={v => setCurrency(v as Currency)}>
                                <SelectTrigger id="currency" className="w-full" aria-invalid={!!errors.currency}>
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError errors={errors.currency ? [{ message: errors.currency }] : []} />
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="validUntil">Valid Until *</FieldLabel>
                            <Input
                                id="validUntil"
                                type="date"
                                value={validUntil}
                                min={new Date().toISOString().split("T")[0]}
                                onChange={e => setValidUntil(e.target.value)}
                                aria-invalid={!!errors.validUntil}
                            />
                            <FieldError errors={errors.validUntil ? [{ message: errors.validUntil }] : []} />
                        </Field>
                    </div>
                </FieldGroup>
            </FieldSet>

            <Separator />

            {/* ── Section 2 — Line items ── */}
            <FieldSet>
                <div className="flex items-center justify-between">
                    <div>
                        <FieldLegend className="mb-0">Line Items *</FieldLegend>
                        <FieldDescription className="mt-0.5">
                            Add each product or service you are quoting. Click an item to expand details.
                        </FieldDescription>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                        Total:&nbsp;{total}
                    </span>
                </div>

                {errors.lineItems && (
                    <FieldError errors={[{ message: errors.lineItems }]} />
                )}

                <div className="mt-2 space-y-2">
                    {items.map((item, idx) => {
                        const isOpen = expanded.has(item._key)
                        const subtotal = item.qty * item.unitPrice
                        return (
                            <div
                                key={item._key}
                                className="overflow-hidden rounded-lg border bg-card ring-foreground/5 transition-shadow hover:shadow-sm"
                            >
                                {/* ─ collapsed header ─ */}
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => toggleExpand(item._key)}
                                    onKeyDown={e => (e.key === "Enter" || e.key === " ") && toggleExpand(item._key)}
                                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left"
                                >
                                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                                        {idx + 1}
                                    </span>
                                    <span className="flex-1 truncate text-sm font-medium text-foreground">
                                        {item.name || <span className="text-muted-foreground">Untitled item</span>}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {item.qty} {item.unit} × {currency}&nbsp;{item.unitPrice.toFixed(2)}
                                        &nbsp;=&nbsp;
                                        <span className="font-semibold text-foreground">
                                            {currency}&nbsp;{subtotal.toFixed(2)}
                                        </span>
                                    </span>
                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); removeItem(item._key) }}
                                            className="ml-1 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                            title="Remove item"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    )}
                                    {isOpen
                                        ? <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                                        : <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                                    }
                                </div>

                                {/* ─ expanded detail ─ */}
                                {isOpen && (
                                    <div className="border-t px-4 pb-4 pt-3">
                                        <FieldGroup>
                                            <Field>
                                                <FieldLabel>Item Name *</FieldLabel>
                                                <Input
                                                    placeholder="e.g. Kraft Paper Cups (8 oz)"
                                                    value={item.name}
                                                    onChange={e => updateItem(item._key, { name: e.target.value })}
                                                />
                                            </Field>

                                            <Field>
                                                <FieldLabel>Description</FieldLabel>
                                                <Input
                                                    placeholder="Optional — size, material, grade, etc."
                                                    value={item.description ?? ""}
                                                    onChange={e => updateItem(item._key, { description: e.target.value })}
                                                />
                                            </Field>

                                            <div className="grid grid-cols-3 gap-3">
                                                <Field>
                                                    <FieldLabel>Quantity *</FieldLabel>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={item.qty}
                                                        onChange={e => updateItem(item._key, { qty: Number(e.target.value) })}
                                                    />
                                                </Field>

                                                <Field>
                                                    <FieldLabel>Unit *</FieldLabel>
                                                    <Select
                                                        value={item.unit}
                                                        onValueChange={v => updateItem(item._key, { unit: v })}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {UNITS.map(u => (
                                                                <SelectItem key={u} value={u}>{u}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </Field>

                                                <Field>
                                                    <FieldLabel>Unit Price ({currency}) *</FieldLabel>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step={0.01}
                                                        value={item.unitPrice}
                                                        onChange={e => updateItem(item._key, { unitPrice: Number(e.target.value) })}
                                                    />
                                                </Field>
                                            </div>

                                            <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                                                <span className="text-xs text-muted-foreground">Line subtotal</span>
                                                <span className="text-sm font-semibold">{currency}&nbsp;{subtotal.toFixed(2)}</span>
                                            </div>
                                        </FieldGroup>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="mt-2 w-full border-dashed"
                >
                    <PlusCircle className="size-4" />
                    Add Line Item
                </Button>
            </FieldSet>

            <Separator />

            {/* ── Section 3 — Notes / Terms ── */}
            <FieldSet>
                <FieldLegend>Notes &amp; Terms</FieldLegend>
                <FieldDescription>
                    Include any relevant terms, delivery timelines, certifications, or other information the business should know.
                </FieldDescription>

                <FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="notes">Notes</FieldLabel>
                        <Textarea
                            id="notes"
                            rows={4}
                            placeholder="e.g. All items are food-grade certified. Lead time is 7 working days from order confirmation. GST at actuals."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="resize-none"
                        />
                        <FieldDescription>Optional but highly recommended.</FieldDescription>
                    </Field>
                </FieldGroup>
            </FieldSet>

            {/* ── Summary bar + submit ── */}
            <div className="sticky bottom-0 -mx-6 border-t bg-background/95 px-6 py-4 backdrop-blur supports-backdrop-filter:bg-background/80">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground">Grand Total</p>
                        <p className="text-xl font-bold text-foreground">{total}</p>
                    </div>
                    <Button type="submit" size="lg" disabled={submitting} className="min-w-40">
                        {submitting ? "Submitting…" : "Submit Quotation"}
                    </Button>
                </div>
            </div>
        </form>
    )
}
