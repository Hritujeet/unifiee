import { Loader2 } from "lucide-react";

export default function AuthenticatedLoading() {
    return (
        <div className="flex min-h-[60vh] w-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
    );
}
