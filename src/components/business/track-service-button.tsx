"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useTransition } from "react"
import { ArrowRight, LoaderCircle, UserRoundPlus } from "lucide-react"
import { toast } from "sonner"
import { trackHiredDesignerService } from "@/actions/business-hired-services"
import { Button } from "@/components/ui/button"

export function TrackServiceButton({ serviceId, tracked }: { serviceId: string; tracked: boolean }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const inFlightRef = useRef(false)

    function trackService() {
        if (inFlightRef.current) return
        inFlightRef.current = true
        startTransition(async () => {
            try {
                const result = await trackHiredDesignerService(serviceId, crypto.randomUUID())
                if (!result.success) {
                    toast.error(result.error ?? "Could not track this service.")
                    return
                }
                toast.success("Service added to your hired-services tracker.")
                router.refresh()
            } catch {
                toast.error("Could not track this service. Please try again.")
            } finally {
                inFlightRef.current = false
            }
        })
    }

    if (tracked) {
        return (
            <Button asChild className="flex-1">
                <Link href="/business/hired-services">View project <ArrowRight className="size-4" /></Link>
            </Button>
        )
    }

    return (
        <Button type="button" className="flex-1" onClick={trackService} disabled={isPending} aria-busy={isPending} aria-disabled={isPending}>
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <UserRoundPlus className="size-4" />}
            Track as hired
        </Button>
    )
}
