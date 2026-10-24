"use client";

import * as React from "react";
import { AlertCircle, RefreshCw, XCircle } from "lucide-react";

export interface AiErrorStateProps {
    title?: string;
    message: string;
    isQuota?: boolean;
    onRetry?: () => void;
    onDismiss?: () => void;
    className?: string;
}

export function AiErrorState({
    title = "AI Request Failed",
    message,
    isQuota = false,
    onRetry,
    onDismiss,
    className = "",
}: AiErrorStateProps) {
    return (
        <div
            className={`rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-xs text-foreground ${className}`}
        >
            <div className="flex items-start gap-2.5">
                <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                    <div className="font-semibold text-destructive flex items-center justify-between">
                        <span>{title}</span>
                        {onDismiss && (
                            <button
                                type="button"
                                onClick={onDismiss}
                                className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                            >
                                <XCircle className="size-3.5" />
                            </button>
                        )}
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{message}</p>
                    {isQuota && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            Free-tier quota limit reached. Please wait a moment or try again later.
                        </p>
                    )}
                    {onRetry && (
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={onRetry}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium transition-colors"
                            >
                                <RefreshCw className="size-3" />
                                <span>Try Again</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
