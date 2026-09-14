import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Mail, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact — UNIFIÉE",
  description:
    "We're actively speaking with buyers, vendors, and partners building complex procurement workflows. Reach us directly — we respond personally.",
};

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
    role: "Founder, Vendor Network & Strategy",
    email: "work.vaibhavrajofficial@gmail.com",
    instagram: "vaibhavraj_ind",
    instagramUrl: "https://instagram.com/vaibhavraj_ind",
  },
  {
    name: "Hritujeet Sharma",
    role: "CTO, Platform & Infrastructure",
    email: "sharmahritujeet@gmail.com",
    instagram: "hritujeet",
    instagramUrl: "https://instagram.com/hritujeet",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">

        {/* Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-primary border border-primary/30 rounded-md px-3 py-1.5 mb-8 bg-primary/5">
            <span className="size-1.5 rounded-full bg-primary" />
            Under Development
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-semibold tracking-tight leading-[1.06]">
            Let&apos;s talk procurement, partnerships, or integration.
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-5 leading-relaxed max-w-2xl">
            We&apos;re actively speaking with buyers, vendors, and partners
            building complex procurement workflows. Reach us directly — we
            respond personally.
          </p>
        </div>

        {/* Grid */}
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-5">

          {/* Left — General + Location */}
          <div className="flex flex-col gap-5">

            {/* General Inquiries */}
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-5">
                General Inquiries
              </p>
              <div className="space-y-4">
                <a
                  href="mailto:teamunifiee@gmail.com"
                  className="flex items-center gap-3 group"
                >
                  <div className="size-8 rounded-lg border border-border bg-background flex items-center justify-center group-hover:border-primary/40 transition-colors shrink-0">
                    <Mail className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-0.5">Email</p>
                    <p className="text-sm text-foreground group-hover:text-primary transition-colors">
                      teamunifiee@gmail.com
                    </p>
                  </div>
                </a>

                <a
                  href="https://instagram.com/teamunifiee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <div className="size-8 rounded-lg border border-border bg-background flex items-center justify-center group-hover:border-primary/40 transition-colors shrink-0">
                    <InstagramIcon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-0.5">Instagram</p>
                    <p className="text-sm text-foreground group-hover:text-primary transition-colors">
                      @teamunifiee
                    </p>
                  </div>
                </a>

                <div className="pt-4 border-t border-border">
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSfnqzq5UKUFp_rlQgw7518s-6Gi9Ryu4rXV316FxmEZSeI8HQ/viewform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants(), "w-full gap-2")}
                  >
                    Take our Research Survey
                    <ExternalLink className="size-3.5" />
                  </a>
                  <p className="text-xs text-muted-foreground text-center mt-2.5 font-mono">
                    For buyers · vendors · partners
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-5">
                Location
              </p>
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-lg border border-border bg-background flex items-center justify-center shrink-0">
                  <MapPin className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Kota, Rajasthan</p>
                  <p className="text-sm text-muted-foreground mt-0.5">India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Team */}
          <div className="flex flex-col gap-5">
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
              Core Team
            </p>

            {team.map((member) => (
              <div
                key={member.name}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/20 transition-colors"
              >
                <div className="mb-5">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    {member.name}
                  </h2>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {member.role}
                  </p>
                </div>

                <div className="space-y-3">
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-3 group/link"
                  >
                    <div className="size-7 rounded-md border border-border bg-background flex items-center justify-center group-hover/link:border-primary/40 transition-colors shrink-0">
                      <Mail className="size-3.5 text-muted-foreground group-hover/link:text-primary transition-colors" />
                    </div>
                    <span className="text-sm text-muted-foreground group-hover/link:text-foreground transition-colors truncate">
                      {member.email}
                    </span>
                  </a>

                  <a
                    href={member.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 group/link"
                  >
                    <div className="size-7 rounded-md border border-border bg-background flex items-center justify-center group-hover/link:border-primary/40 transition-colors shrink-0">
                      <InstagramIcon className="size-3.5 text-muted-foreground group-hover/link:text-primary transition-colors" />
                    </div>
                    <span className="text-sm text-muted-foreground group-hover/link:text-foreground transition-colors">
                      @{member.instagram}
                    </span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
