import { cn } from "@/lib/utils";

export function ProductFrame({
  url,
  className,
  children,
}: {
  url: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/70 bg-background shadow-[0_24px_80px_-24px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-border/60 bg-muted/40 px-3 py-2">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
        </div>
        <div className="mx-auto flex h-6 w-full max-w-sm items-center justify-center truncate rounded-md bg-background/80 px-3 font-mono text-[10px] text-muted-foreground">
          {url}
        </div>
      </div>
      <div className="pointer-events-none select-none" aria-hidden>
        {children}
      </div>
    </div>
  );
}
