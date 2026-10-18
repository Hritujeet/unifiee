import { Loader2 } from "lucide-react";

/**
 * Shown instantly during the server-side callback processing,
 * preventing the blank white flash while session/role is being resolved.
 */
export default function CallbackLoading() {
    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 bg-background">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">
                Signing you in…
            </p>
        </div>
    );
}
