"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled || mobileOpen
          ? "bg-background/80 backdrop-blur-sm border-b border-border"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6">
        <nav className="h-16 flex items-center justify-between">
          {/* Wordmark */}
          <Link
            href="/"
            className="font-heading text-xl tracking-[0.25em] uppercase text-foreground hover:opacity-80 transition-opacity"
          >
            Unifiée
          </Link>

          {/* Desktop center links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm transition-colors duration-200",
                  pathname === link.href
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            <a
              id="nav-survey-link"
              href="https://docs.google.com/forms/d/e/1FAIpQLSfnqzq5UKUFp_rlQgw7518s-6Gi9Ryu4rXV316FxmEZSeI8HQ/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Take our Survey
            </a>
            <ThemeToggle />
            <Link
              href="#"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              Sign in
            </Link>
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileOpen((o) => !o)}
              className="size-8 flex items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="size-4" />
              ) : (
                <Menu className="size-4" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden pb-6 pt-2 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm py-3 border-b border-border/50 transition-colors",
                  pathname === link.href
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSfnqzq5UKUFp_rlQgw7518s-6Gi9Ryu4rXV316FxmEZSeI8HQ/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-center")}
              >
                Take our Survey
              </a>
              <Link
                href="#"
                className={buttonVariants({ variant: "default", size: "sm" })}
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
