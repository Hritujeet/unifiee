"use client";

import {
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  Mail,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, type Variants } from "motion/react";

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const team = [
  {
    name: "Vaibhav Raj",
    role: "Founder · Vendor Network & Strategy",
    email: "work.vaibhavrajofficial@gmail.com",
    instagram: "vaibhavraj_ind",
    instagramUrl: "https://instagram.com/vaibhavraj_ind",
    initials: "VR",
  },
  {
    name: "Hritujeet Sharma",
    role: "CTO · Platform & Infrastructure",
    email: "sharmahritujeet@gmail.com",
    instagram: "hritujeet",
    instagramUrl: "https://instagram.com/hritujeet",
    initials: "HS",
  },
];

const motionEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
const revealVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: motionEase },
  },
};
const staggerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

export function ContactContent() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden px-6 pb-14 pt-44 md:pb-20 md:pt-52">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, var(--color-foreground) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_70%)]" />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={staggerVariants}
          className="relative mx-auto max-w-7xl"
        >
          <motion.div variants={revealVariants}>
            <p className="mb-5 font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
              Contact the team
            </p>
            <h1 className="max-w-4xl text-4xl leading-[1.06] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Let&apos;s make packaging easier to move forward.
            </h1>
          </motion.div>
          <motion.div variants={revealVariants} className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Have a requirement, partnership idea, or question about the platform?
              Reach out directly. We&apos;re a small team and we respond personally.
            </p>
            <a
              href="mailto:teamunifiee@gmail.com"
              className={cn(buttonVariants({ size: "lg" }), "shrink-0 gap-2 rounded-full")}
            >
              Email the team
              <ArrowRight className="size-4" />
            </a>
          </motion.div>
        </motion.div>
      </section>

      <section className="border-t border-border/70 py-14 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerVariants}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1"
          >
            <motion.div variants={revealVariants} className="rounded-2xl border border-border/70 bg-card/50 p-6 sm:col-span-2 lg:col-span-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
                    General enquiries
                  </p>
                  <h2 className="mt-3 text-lg font-semibold tracking-tight">Start a conversation.</h2>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <MessageSquare className="size-4" />
                </div>
              </div>
              <a
                href="mailto:teamunifiee@gmail.com"
                className="group mt-6 flex items-center gap-3 rounded-xl border border-border/70 bg-background/50 p-3 transition-colors hover:border-primary/30"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:text-primary">
                  <Mail className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase">Email</p>
                  <p className="truncate text-sm text-foreground">teamunifiee@gmail.com</p>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </a>
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSfnqzq5UKUFp_rlQgw7518s-6Gi9Ryu4rXV316FxmEZSeI8HQ/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline" }), "mt-3 w-full justify-between rounded-xl")}
              >
                Share your perspective
                <ExternalLink className="size-3.5" />
              </a>
              <p className="mt-2 text-center font-mono text-[9px] tracking-widest text-muted-foreground uppercase">
                For buyers · vendors · partners
              </p>
            </motion.div>

            <motion.div variants={revealVariants} className="rounded-2xl border border-border/70 bg-card/50 p-6">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Based in</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Kota, Rajasthan</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">India</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={revealVariants} className="rounded-2xl border border-border/70 bg-card/50 p-6">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Follow along</p>
              <a
                href="https://instagram.com/teamunifiee"
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-5 inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-background transition-colors group-hover:border-primary/30 group-hover:text-primary">
                  <InstagramIcon className="size-4" />
                </span>
                @teamunifiee
                <ArrowUpRight className="size-3.5" />
              </a>
            </motion.div>
          </motion.div>

          <div>
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={revealVariants}
              className="mb-4"
            >
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">The people behind the platform</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Meet the core team.</h2>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerVariants}
              className="grid gap-4 sm:grid-cols-2"
            >
              {team.map((member) => (
                <motion.div
                  key={member.name}
                  variants={revealVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="rounded-2xl border border-border/70 bg-card/50 p-6 transition-colors hover:border-primary/30"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 font-mono text-sm text-primary">
                    {member.initials}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold tracking-tight">{member.name}</h3>
                  <p className="mt-1 min-h-10 text-xs leading-relaxed text-muted-foreground">{member.role}</p>
                  <div className="mt-6 space-y-2 border-t border-border/70 pt-4">
                    <a
                      href={`mailto:${member.email}`}
                      className="group/link flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Mail className="size-3.5 shrink-0" />
                      <span className="truncate">{member.email}</span>
                      <ArrowUpRight className="ml-auto size-3 shrink-0 opacity-0 transition-opacity group-hover/link:opacity-100" />
                    </a>
                    <a
                      href={member.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <InstagramIcon className="size-3.5 shrink-0" />
                      @{member.instagram}
                      <ArrowUpRight className="ml-auto size-3 shrink-0 opacity-0 transition-opacity group-hover/link:opacity-100" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 pt-4 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65, ease: motionEase }}
          className="mx-auto flex max-w-7xl flex-col gap-5 rounded-2xl border border-border/70 bg-muted/20 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
        >
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Have a packaging requirement?</p>
            <p className="mt-2 text-lg font-medium tracking-tight">Tell us what you&apos;re working on.</p>
          </div>
          <a href="mailto:teamunifiee@gmail.com" className={cn(buttonVariants({ variant: "outline" }), "gap-2 rounded-full")}>
            Get in touch
            <ArrowRight className="size-4" />
          </a>
        </motion.div>
      </section>
    </div>
  );
}
