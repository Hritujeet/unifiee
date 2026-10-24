"use client";

import * as React from "react";
import { Sparkles, Loader2 } from "lucide-react";

export interface AiButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    sparklePosition?: "left" | "right";
    variant?: "sparkle" | "outline" | "ghost" | "default";
    size?: "sm" | "md" | "lg";
}

export const AiButton = React.forwardRef<HTMLButtonElement, AiButtonProps>(
    (
        {
            children,
            loading = false,
            sparklePosition = "left",
            variant = "sparkle",
            size = "sm",
            className = "",
            disabled,
            ...props
        },
        ref
    ) => {
        const sizeStyles = {
            sm: "h-8 px-2.5 text-xs gap-1.5 rounded-lg",
            md: "h-9 px-3.5 text-sm gap-2 rounded-lg",
            lg: "h-10 px-4 text-sm gap-2.5 rounded-xl font-medium",
        }[size];

        const variantStyles = {
            sparkle:
                "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-600 text-white shadow-xs border border-purple-500/30 hover:shadow-purple-500/20 active:scale-[0.98]",
            outline:
                "border border-purple-500/40 text-purple-700 dark:text-purple-300 bg-purple-500/5 hover:bg-purple-500/10 active:scale-[0.98]",
            ghost:
                "text-purple-600 dark:text-purple-300 hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-200 active:scale-[0.98]",
            default:
                "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs active:scale-[0.98]",
        }[variant];

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={`inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${sizeStyles} ${variantStyles} ${className}`}
                {...props}
            >
                {loading ? (
                    <Loader2 className="size-3.5 animate-spin shrink-0" />
                ) : (
                    sparklePosition === "left" && (
                        <Sparkles className="size-3.5 shrink-0 text-purple-200" />
                    )
                )}
                <span>{children}</span>
                {!loading && sparklePosition === "right" && (
                    <Sparkles className="size-3.5 shrink-0 text-purple-200" />
                )}
            </button>
        );
    }
);

AiButton.displayName = "AiButton";
