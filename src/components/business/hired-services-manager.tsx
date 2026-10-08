"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { ArrowUpRight, CheckCircle2, Clock3, LoaderCircle, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { completeHiredDesignerService } from "@/actions/business-hired-services"
import { Button } from "@/components/ui/button"
import type { HiredDesignerService } from "@/lib/business/marketplace"

function formatPrice(value: string) {
    const amount = Number(value)
    return Number.isFinite(amount) ? `₹${amount.toLocaleString("en-IN")}` : "Price unavailable"
}

export function HiredServicesManager({ services }: { services: HiredDesignerService[] }) {
    const router = useRouter()
    const [showCompleted, setShowCompleted] = useState(false)
    const [pendingId, setPendingId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const visibleServices = services.filter((service) => showCompleted || service.status === "active")

    function completeService(serviceId: string) {
        setPendingId(serviceId)
        startTransition(async () => {
            try {
                const result = await completeHiredDesignerService(serviceId)
                if (!result.success) {
                    toast.error(result.error ?? "Could not update this service.")
                    return
                }
                toast.success("Service marked as completed.")
                router.refresh()
            } catch {
                toast.error("Could not update this service. Please try again.")
            } finally {
                setPendingId(null)
            }
        })
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    {services.filter((service) => service.status === "active").length} active
                    {" · "}{services.filter((service) => service.status === "completed").length} completed
                </p>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCompleted((value) => !value)}>
                    {showCompleted ? "Hide completed" : "Show completed"}
                </Button>
            </div>

            {visibleServices.length ? (
                <div className="space-y-3">
                    {visibleServices.map((service) => (
                        <article key={service.id} className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
                            {service.sampleImage ? (
                                <Image src={service.sampleImage} alt="" width={112} height={88} unoptimized className="h-24 w-full rounded-lg object-cover sm:w-28" />
                            ) : (
                                <div className="flex h-24 w-full items-center justify-center rounded-lg bg-primary/10 text-primary sm:w-28"><CheckCircle2 className="size-6" /></div>
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="font-heading font-semibold">{service.serviceTitle}</h2>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${service.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                        {service.status === "active" ? "In progress" : "Completed"}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">{service.designerName}</p>
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">{formatPrice(service.price)} / {service.pricingModel.replaceAll("_", " ")}</span>
                                    <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{service.turnaroundDays} days</span>
                                    <span>Tracked {new Date(service.hiredAt).toLocaleDateString("en-IN")}</span>
                                    {service.completedAt && <span>Completed {new Date(service.completedAt).toLocaleDateString("en-IN")}</span>}
                                </div>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                                {service.designerId && (
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/designers/${service.designerId}`}>Profile <ArrowUpRight className="size-3.5" /></Link>
                                    </Button>
                                )}
                                <Button asChild variant="outline" size="sm">
                                    <a href={`mailto:${service.designerEmail}?subject=${encodeURIComponent(`Project follow-up: ${service.serviceTitle}`)}`}>Contact</a>
                                </Button>
                                {service.status === "active" && (
                                    <Button size="sm" disabled={isPending} onClick={() => completeService(service.id)}>
                                        {isPending && pendingId === service.id ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                                        Mark complete
                                    </Button>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed bg-card px-6 py-12 text-center">
                    <RotateCcw className="mx-auto size-8 text-muted-foreground" />
                    <h2 className="mt-3 font-heading text-lg font-semibold">
                        {services.length ? "No active services" : "No hired services tracked yet"}
                    </h2>
                    <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                        {services.length
                            ? "Your completed work is still available with the completed filter."
                            : "When you hire a designer, track their service here to manage its progress and mark it complete."}
                    </p>
                    {!services.length && (
                        <Button asChild className="mt-5">
                            <Link href="/business/designers">Explore designer services <ArrowUpRight className="size-4" /></Link>
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
