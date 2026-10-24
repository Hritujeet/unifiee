"use client";

import * as React from "react";
import { BookOpen, FileText, ExternalLink, Sparkles } from "lucide-react";

export interface AiSourceChipProps {
    title: string;
    entityType?: string;
    url?: string;
    similarityScore?: number;
    snippet?: string;
    className?: string;
}

export function AiSourceChip({
    title,
    entityType = "guide",
    url,
    similarityScore,
    snippet,
    className = "",
}: AiSourceChipProps) {
    const [expanded, setExpanded] = React.useState(false);

    const scorePct = similarityScore ? Math.round(similarityScore * 100) : null;

    return (
        <div className={`inline-flex flex-col text-xs ${className}`}>
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-purple-500/25 bg-purple-500/5 hover:bg-purple-500/10 text-foreground transition-all duration-150 text-left"
                title={snippet ? "Click to view grounded excerpt" : undefined}
            >
                <BookOpen className="size-3 text-purple-500 shrink-0" />
                <span className="font-medium max-w-[180px] truncate">{title}</span>
                {scorePct !== null && (
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold px-1 py-0.2 rounded bg-purple-500/10">
                        {scorePct}%
                    </span>
                )}
            </button>

            {expanded && snippet && (
                <div className="mt-1.5 p-2 rounded-lg bg-muted/80 border border-border text-[11px] text-muted-foreground leading-relaxed animate-in fade-in-50 zoom-in-95">
                    <div className="font-semibold text-foreground mb-1 flex items-center justify-between">
                        <span>Grounded Source Excerpt</span>
                        {url && (
                            <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-0.5 text-purple-600 dark:text-purple-400 hover:underline"
                            >
                                <span>Open</span>
                                <ExternalLink className="size-2.5" />
                            </a>
                        )}
                    </div>
                    <p className="line-clamp-4">{snippet}</p>
                </div>
            )}
        </div>
    );
}
