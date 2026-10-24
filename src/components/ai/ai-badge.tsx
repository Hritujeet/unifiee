import * as React from "react";
import { Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

export interface AiBadgeProps {
    variant?: "ai-filled" | "needs-input" | "verified" | "ai-assisted";
    label?: string;
    className?: string;
}

export function AiBadge({ variant = "ai-filled", label, className = "" }: AiBadgeProps) {
    if (variant === "needs-input") {
        return (
            <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 ${className}`}
                title="This required field could not be inferred and needs your manual input"
            >
                <AlertCircle className="size-3 shrink-0" />
                <span>{label || "Needs your input"}</span>
            </span>
        );
    }

    if (variant === "verified") {
        return (
            <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 ${className}`}
            >
                <CheckCircle2 className="size-3 shrink-0" />
                <span>{label || "Verified Match"}</span>
            </span>
        );
    }

    if (variant === "ai-assisted") {
        return (
            <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 ${className}`}
            >
                <Sparkles className="size-3 shrink-0 text-indigo-500" />
                <span>{label || "AI Assisted"}</span>
            </span>
        );
    }

    // Default: ai-filled
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25 ${className}`}
            title="Automatically extracted by Unifiée AI"
        >
            <Sparkles className="size-3 shrink-0 text-purple-500 animate-pulse" />
            <span>{label || "AI Filled"}</span>
        </span>
    );
}
