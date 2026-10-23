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
        "group/frame transform-gpu relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_24px_80px_-24px_rgba(0,0,0,0.5)] ring-1 ring-white/5 transition-shadow duration-500 hover:shadow-[0_30px_90px_-28px_rgba(37,99,235,0.25)]",
        className,
      )}
    >
      <div className="relative flex items-center gap-2 border-b border-border/60 bg-muted/40 px-2.5 py-2 sm:gap-3 sm:px-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2 rounded-full bg-red-400/80 sm:size-2.5" />
          <span className="size-2 rounded-full bg-amber-400/80 sm:size-2.5" />
          <span className="size-2 rounded-full bg-emerald-400/80 sm:size-2.5" />
        </div>
        <div className="mx-auto flex h-6 min-w-0 w-full max-w-sm items-center justify-center truncate rounded-md border border-border/50 bg-background/80 px-2 font-mono text-[9px] text-muted-foreground sm:px-3 sm:text-[10px]">
          {url}
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 text-[9px] text-muted-foreground sm:inline-flex">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          Preview
        </span>
      </div>
      <div className="pointer-events-none select-none" aria-hidden>
        {children}
      </div>
    </div>
  );
}
