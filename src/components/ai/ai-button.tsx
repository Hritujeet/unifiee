"use client";

import * as React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
            sm: "text-xs",
            md: "text-sm",
            lg: "text-sm font-medium",
        }[size];

        const variantStyles = {
            sparkle: "bg-primary text-primary-foreground hover:bg-primary/90",
            outline:
                "border-primary/30 text-primary hover:bg-primary/10",
            ghost:
                "text-primary hover:bg-primary/10 hover:text-primary",
            default: "",
        }[variant];

        return (
            <Button
                ref={ref}
                disabled={disabled || loading}
                variant={variant === "outline" ? "outline" : variant === "ghost" ? "ghost" : "default"}
                size={size === "sm" ? "sm" : size === "md" ? "default" : "lg"}
                className={`${sizeStyles} ${variantStyles} ${className}`}
                {...props}
            >
                {loading ? (
                    <Loader2 className="size-3.5 animate-spin shrink-0" />
                ) : (
                    sparklePosition === "left" && (
                        <Sparkles className="size-3.5 shrink-0" />
                    )
                )}
                <span>{children}</span>
                {!loading && sparklePosition === "right" && (
                    <Sparkles className="size-3.5 shrink-0" />
                )}
            </Button>
        );
    }
);

AiButton.displayName = "AiButton";
