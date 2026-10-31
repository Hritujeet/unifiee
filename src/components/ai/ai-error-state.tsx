"use client";

import * as React from "react";
import { AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    const isRateLimitOrQuota = isQuota || /rate limit|quota|credit|too many|busy|demand/i.test(message);
    const borderColor = isRateLimitOrQuota ? "border-amber-500/30 bg-amber-500/5" : "border-destructive/30 bg-destructive/5";
    const textColor = isRateLimitOrQuota ? "text-amber-600 dark:text-amber-400" : "text-destructive";

    return (
        <div
            className={`rounded-xl border ${borderColor} p-3.5 text-xs text-foreground ${className}`}
        >
            <div className="flex items-start gap-2.5">
                <AlertCircle className={`size-4 ${textColor} shrink-0 mt-0.5`} />
                <div className="flex-1 space-y-1">
                    <div className={`font-semibold ${textColor} flex items-center justify-between`}>
                        <span>{isRateLimitOrQuota ? "High Demand" : title}</span>
                        {onDismiss && (
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                type="button"
                                onClick={onDismiss}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <XCircle className="size-3.5" />
                            </Button>
                        )}
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{message}</p>
                    {isRateLimitOrQuota && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            Standard fallback suggestions have been provided while high demand subsides.
                        </p>
                    )}
                    {onRetry && (
                        <div className="pt-2">
                            <Button
                                variant={isRateLimitOrQuota ? "outline" : "destructive"}
                                size="sm"
                                type="button"
                                onClick={onRetry}
                                className="text-xs"
                            >
                                <RefreshCw className="size-3 mr-1" />
                                <span>Try Again</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
