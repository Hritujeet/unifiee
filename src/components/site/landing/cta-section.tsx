import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/site/animations";
import { CtaDotField } from "@/components/site/landing/cta-dot-field";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden py-28 md:py-36">
      <CtaDotField />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_65%)]" />

      <FadeIn className="relative mx-auto max-w-3xl px-6">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-xs md:p-12">
          <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Start with one requirement
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Tell us what you need. We&apos;ll help connect the dots.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Begin with a packaging brief—not another list of suppliers to work through alone.
          </p>

          <div className="mt-8 flex flex-col overflow-hidden rounded-xl border border-border bg-muted/30 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-sm text-muted-foreground">
              <MessageSquare className="size-4 shrink-0" />
              <span className="truncate">I need 8oz cups, seasonal sleeves, delivered in Kota…</span>
            </div>
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ size: "lg" }), "m-2 justify-center rounded-xl")}
            >
              Open an account
            </Link>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
