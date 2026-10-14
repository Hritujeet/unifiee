"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const presetPrompts = [
    "1,000 custom printed corrugated mailer boxes 10x8x4 with matte lamination",
    "5,000 double-wall paper coffee cups 8 oz with custom brand logo",
    "2,500 matte black pizza boxes 12 inch for artisanal takeaway pizza",
    "10,000 recyclable stand-up pouches with zip lock and tear notch for granola",
]

export default function NewRequirementPage() {
    const router = useRouter()
    const [prompt, setPrompt] = useState("")
    const [generating, setGenerating] = useState(false)
    const [spec, setSpec] = useState<{
        title: string
        category: string
        material: string
        dimensions: string
        quantity: string
        finish: string
        timeline: string
    } | null>(null)

    const handleGenerate = () => {
        if (!prompt.trim()) {
            toast.error("Please enter a description of your packaging needs.")
            return
        }

        setGenerating(true)
        setTimeout(() => {
            setGenerating(false)
            setSpec({
                title: prompt.slice(0, 40) + (prompt.length > 40 ? "..." : ""),
                category: prompt.toLowerCase().includes("cup") ? "Paper Cups" : prompt.toLowerCase().includes("pouch") ? "Flexible Packaging" : "Corrugated Box",
                material: "Premium Recycled Kraft / Food Grade Board",
                dimensions: "Custom per specification",
                quantity: prompt.match(/\b\d+([,.]\d+)?\b/)?.[0] || "1,000 units",
                finish: "Matte coating with eco-friendly water-based inks",
                timeline: "Standard 10–14 days production",
            })
            toast.success("Requirement structured successfully!")
        }, 800)
    }

    const handleSubmit = () => {
        toast.success("Requirement published! Matching vendors have been notified.")
        router.push("/business/requirements")
    }

    return (
        <div className="mx-auto w-full max-w-3xl space-y-6">
            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="icon" className="size-8">
                    <Link href="/business"><ArrowLeft className="size-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground font-heading">New requirement</h1>
                    <p className="text-xs text-muted-foreground">Start with AI intake to turn your packaging ideas into vendor-ready requirements.</p>
                </div>
            </div>

            <Card className="border-border/50 bg-card p-6 space-y-5">
                <CardHeader className="p-0 space-y-2">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-blue-500" />
                        Describe your packaging
                    </label>
                    <Textarea
                        rows={4}
                        placeholder="e.g. Need 2,500 matte black corrugated pizza boxes 12x12x2 inch for artisanal takeaway, custom 2-color print with grease-resistant lining..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="resize-none text-sm bg-muted/30 focus-visible:ring-1 focus-visible:ring-blue-500"
                    />
                </CardHeader>

                <CardContent className="p-0 space-y-2">
                    <span className="text-[11px] font-medium text-muted-foreground">Try sample descriptions:</span>
                    <div className="flex flex-wrap gap-1.5">
                        {presetPrompts.map((p, idx) => (
                            <Badge
                                key={idx}
                                variant="outline"
                                onClick={() => setPrompt(p)}
                                className="text-left text-xs bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground font-normal transition-colors cursor-pointer"
                            >
                                {p}
                            </Badge>
                        ))}
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end p-0 pt-2 bg-transparent border-t-0">
                    <Button
                        onClick={handleGenerate}
                        disabled={generating || !prompt.trim()}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs h-9"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Structuring requirement...
                            </>
                        ) : (
                            <>
                                <Sparkles className="size-3.5 mr-1.5" /> Generate requirement
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>

            {spec && (
                <Card className="border-blue-500/30 bg-blue-500/5 p-6 space-y-4 animate-in fade-in-50 duration-200">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-3 p-0">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-emerald-500" />
                            <CardTitle className="text-sm font-semibold text-foreground">Requirement preview</CardTitle>
                        </div>
                        <Badge variant="secondary" className="text-xs font-medium">{spec.category}</Badge>
                    </CardHeader>

                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-0 text-xs">
                        <Card size="sm" className="bg-card/70 border-border/40 p-3">
                            <span className="text-muted-foreground block text-[11px]">Material</span>
                            <span className="font-semibold text-foreground">{spec.material}</span>
                        </Card>
                        <Card size="sm" className="bg-card/70 border-border/40 p-3">
                            <span className="text-muted-foreground block text-[11px]">Target quantity</span>
                            <span className="font-semibold text-foreground">{spec.quantity}</span>
                        </Card>
                        <Card size="sm" className="bg-card/70 border-border/40 p-3">
                            <span className="text-muted-foreground block text-[11px]">Finishing & Print</span>
                            <span className="font-semibold text-foreground">{spec.finish}</span>
                        </Card>
                        <Card size="sm" className="bg-card/70 border-border/40 p-3">
                            <span className="text-muted-foreground block text-[11px]">Production timeline</span>
                            <span className="font-semibold text-foreground">{spec.timeline}</span>
                        </Card>
                    </CardContent>

                    <CardFooter className="flex justify-end gap-2 p-0 pt-2 bg-transparent border-t-0">
                        <Button variant="outline" size="sm" onClick={() => setSpec(null)}>
                            Edit description
                        </Button>
                        <Button size="sm" onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-500 text-white font-medium">
                            Submit requirement <ArrowRight className="size-3.5 ml-1" />
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}
