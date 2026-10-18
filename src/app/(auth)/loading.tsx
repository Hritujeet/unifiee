import { Loader2 } from "lucide-react";

export default function AuthLoading() {
    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 bg-background">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
    );
}
