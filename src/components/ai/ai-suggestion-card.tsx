"use client";

import * as React from "react";
import { Sparkles, Check, X, Edit3, ArrowRight } from "lucide-react";

export interface AiSuggestionCardProps {
    title?: string;
    original?: string;
    suggestion: string;
    rationale?: string;
    onAccept: (suggestion: string) => void;
    onEdit?: (suggestion: string) => void;
    onDismiss: () => void;
    className?: string;
    fieldLabel?: string;
}

export function AiSuggestionCard({
    title = "AI Improvement Suggestion",
    original,
    suggestion,
    rationale,
    onAccept,
    onEdit,
    onDismiss,
    className = "",
    fieldLabel,
}: AiSuggestionCardProps) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editedValue, setEditedValue] = React.useState(suggestion);

    const [prevSuggestion, setPrevSuggestion] = React.useState(suggestion);
    if (prevSuggestion !== suggestion) {
        setPrevSuggestion(suggestion);
        setEditedValue(suggestion);
    }

    return (
        <div
            className={`rounded-xl border border-purple-500/25 bg-gradient-to-b from-purple-500/[0.07] to-indigo-500/[0.03] p-3.5 shadow-xs transition-all duration-200 ${className}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-border/40">
                <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-md bg-purple-500/20 text-purple-600 dark:text-purple-400">
                        <Sparkles className="size-3" />
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                        {title}
                        {fieldLabel && (
                            <span className="ml-1 font-normal text-muted-foreground">
                                for <strong className="text-foreground">{fieldLabel}</strong>
                            </span>
                        )}
                    </span>
                </div>
                <button
                    onClick={onDismiss}
                    type="button"
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title="Dismiss suggestion"
                >
                    <X className="size-3.5" />
                </button>
            </div>

            {/* Content Comparison */}
            <div className="space-y-2 text-xs">
                {original && (
                    <div className="rounded-lg bg-background/60 p-2.5 border border-border/40">
                        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                            Current Value
                        </div>
                        <div className="line-clamp-2 text-muted-foreground line-through decoration-red-400/50">
                            {original}
                        </div>
                    </div>
                )}

                <div className="rounded-lg bg-background p-2.5 border border-purple-500/30 ring-1 ring-purple-500/10">
                    <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
                        <span>Suggested Value</span>
                        {rationale && <span className="normal-case italic text-muted-foreground">{rationale}</span>}
                    </div>

                    {isEditing ? (
                        <textarea
                            value={editedValue}
                            onChange={(e) => setEditedValue(e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                        />
                    ) : (
                        <div className="text-foreground font-medium whitespace-pre-wrap">
                            {suggestion}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions: Human in the loop */}
            <div className="flex items-center justify-end gap-2 pt-3 mt-1">
                <button
                    type="button"
                    onClick={onDismiss}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/70 transition-colors"
                >
                    <X className="size-3" />
                    <span>Dismiss</span>
                </button>

                {onEdit && !isEditing && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-foreground rounded-lg border border-border/80 hover:bg-muted/60 transition-colors"
                    >
                        <Edit3 className="size-3 text-muted-foreground" />
                        <span>Edit</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => {
                        const finalVal = isEditing ? editedValue : suggestion;
                        onAccept(finalVal);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg shadow-xs transition-all active:scale-[0.98]"
                >
                    <Check className="size-3.5" />
                    <span>{isEditing ? "Apply Edits" : "Accept Suggestion"}</span>
                </button>
            </div>
        </div>
    );
}
