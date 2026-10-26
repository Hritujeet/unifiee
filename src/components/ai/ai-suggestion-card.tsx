"use client";

import * as React from "react";
import { Sparkles, Check, X, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

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
        <Card className={`p-3.5 shadow-xs ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-border/40">
                <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-primary">
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
                <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onDismiss}
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    title="Dismiss suggestion"
                >
                    <X className="size-3.5" />
                </Button>
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

                <div className="rounded-lg border border-primary/20 bg-background p-2.5 ring-1 ring-primary/10">
                    <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-primary">
                        <span>Suggested Value</span>
                        {rationale && <span className="normal-case italic text-muted-foreground">{rationale}</span>}
                    </div>

                    {isEditing ? (
                        <Textarea
                            value={editedValue}
                            onChange={(e) => setEditedValue(e.target.value)}
                            rows={3}
                            className="min-h-0 text-xs"
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
                <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={onDismiss}
                    className="text-xs text-muted-foreground"
                >
                    <X className="size-3" />
                    <span>Dismiss</span>
                </Button>

                {onEdit && !isEditing && (
                    <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="text-xs"
                    >
                        <Edit3 className="size-3 text-muted-foreground" />
                        <span>Edit</span>
                    </Button>
                )}

                <Button
                    size="sm"
                    type="button"
                    onClick={() => {
                        const finalVal = isEditing ? editedValue : suggestion;
                        onAccept(finalVal);
                    }}
                    className="text-xs"
                >
                    <Check className="size-3.5" />
                    <span>{isEditing ? "Apply Edits" : "Accept Suggestion"}</span>
                </Button>
            </div>
        </Card>
    );
}
