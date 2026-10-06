"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createDesignerService, deleteDesignerService } from "@/actions/designer-services"
import { BriefcaseBusiness, Clock3, ImagePlus, LoaderCircle, Plus, RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Service = {
    id: string
    title: string
    description: string
    serviceType: string
    pricingModel: string
    price: string
    turnaroundDays: number
    revisionsIncluded: number
    deliverables: string[]
    sampleImages: string[]
    status: string
}

const serviceTypeLabels: Record<string, string> = {
    packaging_design: "Packaging design",
    label_design: "Label design",
    brand_identity: "Brand identity",
    "3d_rendering": "3D rendering",
    print_ready_artwork: "Print-ready artwork",
}

const pricingLabels: Record<string, string> = {
    per_project: "per project",
    per_design: "per design",
    hourly: "per hour",
}

function AddServiceDialog() {
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [serviceType, setServiceType] = useState("packaging_design")
    const [pricingModel, setPricingModel] = useState("per_project")
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setSaving(true)
        try {
            const result = await createDesignerService(formData)
            if (!result.success) {
                toast.error(result.error ?? "Could not add this service.")
                return
            }

            toast.success("Service added")
            setOpen(false)
            router.refresh()
        } catch {
            toast.error("Something went wrong while saving this service.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !saving && setOpen(nextOpen)}>
            <DialogTrigger asChild>
                <Button><Plus data-icon="inline-start" /> Add a service</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add a service</DialogTitle>
                    <DialogDescription>
                        Create a clear, standalone offering with its own pricing, deliverables, and work samples.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium">
                            Service title
                            <Input name="title" placeholder="e.g. Food packaging design" minLength={3} maxLength={160} required />
                        </label>
                        <label className="space-y-2 text-sm font-medium">
                            Category
                            <Select value={serviceType} onValueChange={(value) => value && setServiceType(value)}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="packaging_design">Packaging design</SelectItem>
                                    <SelectItem value="label_design">Label design</SelectItem>
                                    <SelectItem value="brand_identity">Brand identity</SelectItem>
                                    <SelectItem value="3d_rendering">3D rendering</SelectItem>
                                    <SelectItem value="print_ready_artwork">Print-ready artwork</SelectItem>
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="serviceType" value={serviceType} />
                        </label>
                    </div>

                    <label className="block space-y-2 text-sm font-medium">
                        Description
                        <Textarea name="description" className="min-h-24" placeholder="Describe what this service includes and who it is for." minLength={20} maxLength={3000} required />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <label className="space-y-2 text-sm font-medium">
                            Price (INR)
                            <Input name="price" type="number" min="1" step="0.01" placeholder="15000" required />
                        </label>
                        <label className="space-y-2 text-sm font-medium">
                            Price is
                            <Select value={pricingModel} onValueChange={(value) => value && setPricingModel(value)}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="per_project">Per project</SelectItem>
                                    <SelectItem value="per_design">Per design</SelectItem>
                                    <SelectItem value="hourly">Per hour</SelectItem>
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="pricingModel" value={pricingModel} />
                        </label>
                        <label className="space-y-2 text-sm font-medium">
                            Turnaround (days)
                            <Input name="turnaroundDays" type="number" min="1" max="365" placeholder="7" required />
                        </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium">
                            Revisions included
                            <Input name="revisionsIncluded" type="number" min="0" max="50" defaultValue="2" required />
                        </label>
                        <label className="space-y-2 text-sm font-medium">
                            Deliverables <span className="font-normal text-muted-foreground">(one per line)</span>
                            <Textarea name="deliverables" className="min-h-20" placeholder={"Print-ready files\n3D mockups"} />
                        </label>
                    </div>

                    <label className="block space-y-2 text-sm font-medium">
                        Work sample image URLs <span className="font-normal text-muted-foreground">(required, one HTTPS URL per line, up to 8)</span>
                        <Textarea name="sampleImages" className="min-h-20" placeholder={"https://example.com/packaging-concept.jpg"} required />
                        <span className="block text-xs font-normal text-muted-foreground">
                            Use publicly accessible image links for now. Each service can showcase its own relevant samples.
                        </span>
                    </label>

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? <LoaderCircle className="animate-spin" /> : <Plus />}
                            Add service
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function ServiceCard({ service, onDelete }: { service: Service; onDelete: (service: Service) => void }) {
    const price = Number(service.price).toLocaleString("en-IN")

    return (
        <article className="overflow-hidden rounded-xl border bg-card text-card-foreground">
            {service.sampleImages.length ? (
                <div className="grid h-44 grid-cols-2 gap-1 overflow-hidden bg-muted">
                    {service.sampleImages.slice(0, 2).map((src, index) => (
                        <Image
                            key={`${service.id}-${src}`}
                            src={src}
                            alt={`${service.title} sample ${index + 1}`}
                            width={640}
                            height={360}
                            unoptimized
                            className="h-full w-full object-cover"
                        />
                    ))}
                </div>
            ) : (
                <div className="flex h-44 items-center justify-center bg-muted text-muted-foreground">
                    <ImagePlus className="size-8" />
                </div>
            )}
            <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">{serviceTypeLabels[service.serviceType] ?? service.serviceType}</p>
                        <h2 className="mt-1 line-clamp-2 font-heading text-lg font-semibold">{service.title}</h2>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        {service.status === "active" ? "Published" : "Paused"}
                    </span>
                </div>
                <p className="line-clamp-3 min-h-[3.75rem] text-sm leading-5 text-muted-foreground">{service.description}</p>
                <div className="flex items-end justify-between gap-3 border-t pt-4">
                    <div>
                        <p className="text-xs text-muted-foreground">Starting at</p>
                        <p className="mt-1 font-heading text-xl font-semibold">₹{price}<span className="ml-1 text-xs font-normal text-muted-foreground">{pricingLabels[service.pricingModel] ?? service.pricingModel}</span></p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{service.turnaroundDays}d</span>
                        <span className="inline-flex items-center gap-1"><RotateCcw className="size-3.5" />{service.revisionsIncluded}</span>
                    </div>
                </div>
                {service.deliverables.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {service.deliverables.slice(0, 3).map((deliverable) => (
                            <span key={deliverable} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{deliverable}</span>
                        ))}
                    </div>
                )}
                <div className="flex justify-end border-t pt-3">
                    <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => onDelete(service)}>
                        <Trash2 /> Remove service
                    </Button>
                </div>
            </div>
        </article>
    )
}

export function DesignerServicesManager({ services }: { services: Service[] }) {
    const router = useRouter()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    async function handleDelete(service: Service) {
        if (!window.confirm(`Remove "${service.title}" from your services?`)) return

        setDeletingId(service.id)
        try {
            const result = await deleteDesignerService(service.id)
            if (!result.success) {
                toast.error(result.error ?? "Could not remove this service.")
                return
            }

            toast.success("Service removed")
            router.refresh()
        } catch {
            toast.error("Something went wrong while removing this service.")
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">{services.length} {services.length === 1 ? "service" : "services"} listed</p>
                <AddServiceDialog />
            </div>
            {services.length ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {services.map((service) => (
                        <div key={service.id} className={deletingId === service.id ? "pointer-events-none opacity-50" : ""}>
                            <ServiceCard service={service} onDelete={handleDelete} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-10 text-center">
                    <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><BriefcaseBusiness className="size-5" /></span>
                    <h2 className="font-heading text-lg font-semibold">Your services will live here</h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                        Add a service with its own pricing, deliverables, turnaround, and work samples. You can list multiple offerings.
                    </p>
                    <div className="mt-5"><AddServiceDialog /></div>
                </div>
            )}
        </div>
    )
}
