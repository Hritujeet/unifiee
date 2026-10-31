"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateDesignerServiceStatusAction, type DesignerIncomingProject } from "@/actions/business-hired-services"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function IncomingProjectsView({ projects }: { projects: DesignerIncomingProject[] }) {
    const router = useRouter()
    const [pendingId, setPendingId] = useState<string | null>(null)

    async function updateProject(project: DesignerIncomingProject, status: "active" | "in_review" | "completed") {
        setPendingId(project.id)
        try {
            const result = await updateDesignerServiceStatusAction({
                serviceId: project.id,
                status,
                notes: status === "in_review" ? "Delivery submitted for client review." : project.notes ?? undefined,
            })
            if (!result.success) {
                toast.error("Couldn't save project")
                return
            }
            toast.success(status === "completed" ? "Project completed" : "Status saved")
            router.refresh()
        } catch {
            toast.error("Couldn't save project")
        } finally {
            setPendingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading text-3xl font-semibold tracking-tight">Client orders & active contracts</h1>
                <p className="mt-2 text-sm text-muted-foreground">Manage incoming business hires and submit completed deliverables for review.</p>
            </div>
            {projects.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No client projects have been assigned yet.</CardContent></Card>
            ) : (
                <div className="grid gap-4">
                    {projects.map((project) => (
                        <Card key={project.id}>
                            <CardHeader className="flex flex-row items-start justify-between gap-4">
                                <div>
                                    <CardTitle className="text-base">{project.serviceTitle}</CardTitle>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {project.businessName} · {project.businessEmail} · {project.businessPhone}
                                    </p>
                                </div>
                                <Badge variant={project.status === "completed" ? "default" : "secondary"}>
                                    {project.status.replace("_", " ")}
                                </Badge>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <span>₹{Number(project.price).toLocaleString("en-IN")}</span>
                                    <span>·</span>
                                    <span>{project.turnaroundDays} day turnaround</span>
                                </div>
                                {project.deliverables.length > 0 && (
                                    <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                                        {project.deliverables.map((deliverable) => <li key={deliverable}>{deliverable}</li>)}
                                    </ul>
                                )}
                                {project.status !== "completed" && (
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={pendingId !== null}
                                            onClick={() => updateProject(project, "in_review")}
                                        >
                                            {pendingId === project.id ? "Updating..." : "Submit for review"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            disabled={pendingId !== null}
                                            onClick={() => updateProject(project, "completed")}
                                        >
                                            Mark complete
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
