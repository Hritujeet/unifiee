"use client"

import { useState } from "react"
import { Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface VendorMatch {
    id: string
    title: string
    description: string
    city: string
    state: string
    matchScore: number
    whyMatched: string
}

export function RequirementVendorSearch({ requirementId }: { requirementId: string }) {
    const [matches, setMatches] = useState<VendorMatch[] | null>(null)
    const [loading, setLoading] = useState(false)

    async function findMatches() {
        setLoading(true)
        try {
            const response = await fetch("/api/ai/requirements/search-vendors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requirementId, limit: 5 }),
            })
            const data = await response.json()
            if (!response.ok) {
                toast.info("Search in progress", { description: "Try again shortly." })
                return
            }
            setMatches(data.listings ?? [])
            if (data.state === "not_ready") {
                toast.info("Search in progress", { description: "Try again shortly." })
            } else if ((data.listings ?? []).length === 0) {
                toast.info("No vendors found", { description: "Try broadening criteria." })
            }
        } catch (error) {
            toast.error("Search failed", { description: "Try again." })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-2 border-t border-border/50 pt-3">
            <Button variant="outline" size="sm" onClick={findMatches} disabled={loading} className="text-xs">
                {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
                {loading ? "Searching vendors..." : "Find matching vendors"}
            </Button>
            {matches !== null && matches.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                    {matches.map((match) => (
                        <div key={match.id} className="rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs">
                            <div className="flex items-start justify-between gap-2">
                                <span className="font-medium">{match.title}</span>
                                <Badge variant="secondary" className="shrink-0 text-[10px]">
                                    {Math.round(match.matchScore * 100)}%
                                </Badge>
                            </div>
                            <p className="mt-1 line-clamp-2 text-muted-foreground">{match.description}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">{match.city}, {match.state}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
