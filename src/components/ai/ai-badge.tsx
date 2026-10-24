import * as React from "react";
import { Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface AiBadgeProps {
    variant?: "ai-filled" | "needs-input" | "verified" | "ai-assisted";
    label?: string;
    className?: string;
}

export function AiBadge({ variant = "ai-filled", label, className = "" }: AiBadgeProps) {
    if (variant === "needs-input") {
        return (
            <Badge
                variant="outline"
                className={`h-5 border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-700 dark:text-amber-400 ${className}`}
                title="This required field could not be inferred and needs your manual input"
            >
                <AlertCircle className="size-3 shrink-0" />
                <span>{label || "Needs your input"}</span>
            </Badge>
        );
    }

    if (variant === "verified") {
        return (
            <Badge
                variant="outline"
                className={`h-5 border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-700 dark:text-emerald-400 ${className}`}
            >
                <CheckCircle2 className="size-3 shrink-0" />
                <span>{label || "Verified Match"}</span>
            </Badge>
        );
    }

    if (variant === "ai-assisted") {
        return (
            <Badge
                variant="outline"
                className={`h-5 border-primary/30 bg-primary/10 text-[11px] text-primary ${className}`}
            >
                <Sparkles className="size-3 shrink-0" />
                <span>{label || "AI Assisted"}</span>
            </Badge>
        );
    }

    // Default: ai-filled
    return (
        <Badge
            variant="outline"
            className={`h-5 border-primary/30 bg-primary/10 text-[11px] text-primary ${className}`}
            title="Automatically extracted by Unifiée AI"
        >
            <Sparkles className="size-3 shrink-0" />
            <span>{label || "AI Filled"}</span>
        </Badge>
    );
}
