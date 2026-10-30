import type { OrderFulfillmentMilestone } from "@/lib/db/schema/vendor-fulfillment"

export function OrderTimeline({ milestones }: { milestones: OrderFulfillmentMilestone[] }) {
    if (!milestones.length) return <p className="text-sm text-muted-foreground">No lifecycle updates yet.</p>
    return (
        <ol className="space-y-3">
            {milestones.map((milestone) => (
                <li key={milestone.id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                        <p className="font-medium">{milestone.title}</p>
                        <p className="text-xs text-muted-foreground">{milestone.note || milestone.description || "Status updated."}</p>
                        <time className="text-[11px] text-muted-foreground">{new Date(milestone.createdAt).toLocaleString("en-IN")}</time>
                    </div>
                </li>
            ))}
        </ol>
    )
}
