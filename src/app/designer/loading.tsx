import { Loader2 } from "lucide-react";

export default function DesignerLoading() {
    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-center gap-3 bg-background">
            <Loader2 className="size-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading studio…</p>
        </div>
    );
}
