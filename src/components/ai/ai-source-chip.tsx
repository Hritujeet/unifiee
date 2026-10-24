"use client";

import * as React from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    url,
    similarityScore,
    snippet,
    className = "",
}: AiSourceChipProps) {
    const [expanded, setExpanded] = React.useState(false);

    const scorePct = similarityScore ? Math.round(similarityScore * 100) : null;

    return (
        <div className={`inline-flex flex-col text-xs ${className}`}>
            <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="justify-start text-left"
                title={snippet ? "Click to view grounded excerpt" : undefined}
            >
                <BookOpen className="size-3 text-purple-500 shrink-0" />
                <span className="font-medium max-w-[180px] truncate">{title}</span>
                {scorePct !== null && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] text-primary">
                        {scorePct}%
                    </Badge>
                )}
            </Button>

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
