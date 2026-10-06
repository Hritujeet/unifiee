import type { LucideIcon } from "lucide-react"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

export function PageHeading({
    eyebrow,
    title,
    description,
    action,
}: {
    eyebrow: string
    title: string
    description: string
    action?: ReactNode
}) {
    return (
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-[2.15rem]">{title}</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            {action}
        </div>
    )
}

export function SectionHeading({
    title,
    detail,
    href,
    linkText,
}: {
    title: string
    detail?: string
    href?: string
    linkText?: string
}) {
    return (
        <div className="flex items-end justify-between gap-4">
            <div>
                <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
                {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
            </div>
            {href && linkText && (
                <Link href={href} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                    {linkText}<ArrowRight className="size-4" />
                </Link>
            )}
        </div>
    )
}

export function StatCard({
    label,
    value,
    detail,
    icon: Icon,
    tone = "primary",
}: {
    label: string
    value: string
    detail: string
    icon: LucideIcon
    tone?: "primary" | "secondary" | "accent"
}) {
    const tones = {
        primary: "bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        accent: "bg-accent text-accent-foreground",
    }

    return (
        <article className="rounded-xl border bg-card p-5 text-card-foreground">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">{value}</p>
                </div>
                <span className={`flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="size-5" /></span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
        </article>
    )
}

export function InitialsAvatar({ name, className = "" }: { name: string; className?: string }) {
    const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "D"
    return (
        <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary ${className}`} aria-label={name}>
            {initials}
        </span>
    )
}

export function AvailabilityBadge({ status, inverted = false }: { status: string | null; inverted?: boolean }) {
    const available = status === "available"
    const limited = status === "limited"
    const unavailable = status === "unavailable"
    const colors = inverted
        ? "bg-primary-foreground/15 text-primary-foreground"
        : available
            ? "bg-primary/10 text-primary"
            : limited
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground"
    const indicatorColor = inverted
        ? "bg-primary-foreground"
        : available
            ? "bg-primary"
            : limited
                ? "bg-secondary-foreground"
                : "bg-muted-foreground"

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${colors}`}>
            <span className={`size-1.5 rounded-full ${indicatorColor}`} />
            {available ? "Available for work" : limited ? "Limited availability" : unavailable ? "Not taking projects" : "Availability not set"}
        </span>
    )
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    href,
    action,
}: {
    icon: LucideIcon
    title: string
    description: string
    href?: string
    action?: string
}) {
    return (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-10 text-center text-card-foreground">
            <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
            <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
            {href && action && (
                <Link href={href} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                    {action}<ArrowRight className="size-4" />
                </Link>
            )}
        </div>
    )
}

export function ProfileStrengthCard({
    completion,
    missing,
}: {
    completion: number
    missing: string[]
}) {
    return (
        <article className="rounded-xl border bg-card p-5 text-card-foreground">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-primary" />
                        <h2 className="font-heading font-semibold text-foreground">Make your profile stand out</h2>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">A complete profile helps brands understand your studio.</p>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">{completion}%</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completion}%` }} />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                    {missing.length ? `Next up: ${missing.slice(0, 2).join(" and ")}` : "Your profile has all the key details."}
                </p>
                <Link href="/designer/profile" className="text-xs font-semibold text-primary hover:underline">Review profile</Link>
            </div>
        </article>
    )
}

export function PackagingArtwork({ index = 0 }: { index?: number }) {
    const artworkTone = index % 2 === 0
        ? { background: "bg-muted", package: "bg-primary", detail: "bg-accent" }
        : { background: "bg-secondary", package: "bg-primary", detail: "bg-accent" }

    return (
        <div className={`relative flex h-36 items-center justify-center overflow-hidden rounded-lg ${artworkTone.background}`}>
            <span className="absolute -right-4 -top-8 size-24 rounded-full border border-foreground/10" />
            <span className="absolute -bottom-12 -left-4 size-28 rounded-full border border-foreground/10" />
            <div className="relative flex items-end gap-2">
                <div className={`relative h-[4.5rem] w-14 rounded-b-lg rounded-t-[1.15rem] border border-background/60 shadow-md ${artworkTone.package}`}>
                    <div className="absolute -top-1 left-1/2 h-2 w-11 -translate-x-1/2 rounded-full bg-background" />
                    <div className="absolute inset-x-1.5 top-5 rounded-sm bg-background px-1 py-1.5 text-center">
                        <span className="block text-[6px] font-bold uppercase tracking-[0.15em] text-foreground">FIELD</span>
                        <span className={`mx-auto mt-1 block h-px w-5 ${artworkTone.detail}`} />
                    </div>
                </div>
                <div className={`relative h-14 w-16 rounded-sm border border-background/70 shadow-md ${artworkTone.detail}`}>
                    <div className="absolute inset-1.5 flex flex-col items-center justify-center border border-background/50">
                        <span className="text-[6px] font-bold uppercase tracking-[0.18em] text-accent-foreground">GOOD</span>
                        <span className="mt-1 text-[6px] uppercase tracking-[0.12em] text-accent-foreground/80">things inside</span>
                    </div>
                </div>
            </div>
            <span className="absolute bottom-2.5 right-3 text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Packaging study {String(index + 1).padStart(2, "0")}</span>
        </div>
    )
}
