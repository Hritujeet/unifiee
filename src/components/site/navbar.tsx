"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useUserRoleStore } from "@/lib/stores/user-role-store";
import { ArrowRight, ArrowUpRight, Loader2, LogOut, Menu, X, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import LogoLight from "@/img/LogoLight.png";
import LogoDark from "@/img/LogoDark.png";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "./theme-toggle";
import { AnimatePresence, motion } from "motion/react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#platform", label: "Platform" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

type InitialSession = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
} | null;

type InitialRole = "manufacturer" | "designer" | "business" | "none" | null;

interface NavbarClientProps {
  initialSession: InitialSession;
  initialRole: InitialRole;
}

export function NavbarClient({ initialSession, initialRole }: NavbarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Use the client session hook for real-time updates (sign in/out),
  // but seed with server data so there's no loading spinner on first paint
  const { data: liveSession, isPending: sessionPending } = authClient.useSession();

  // After hydration, prefer live session. Before that, use server-provided data.
  // `isPending` from useSession is true only on the very first client fetch.
  const session = sessionPending ? initialSession : liveSession;
  const isLoading = sessionPending && !initialSession;

  // Hydrate the role store with the server-provided role immediately
  const storeRole = useUserRoleStore((s) => s.role);
  const setRole = useUserRoleStore((s) => s.setRole);

  useEffect(() => {
    if (initialRole !== null && storeRole === null) {
      setRole(initialRole);
    }
  }, [initialRole, storeRole, setRole]);

  // If user signs out client-side, clear the role
  useEffect(() => {
    if (!sessionPending && !liveSession?.user) {
      setRole(null);
    }
  }, [sessionPending, liveSession, setRole]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setMobileOpen(false);
    setRole(null);
    await authClient.signOut();
    toast.success("Signed out successfully");
    router.push("/");
    router.refresh();
  };

  // Use server-hydrated role (or store role after client updates)
  const currentRole = storeRole ?? initialRole;

  // Dashboard href & label derived from role
  const dashboardHref =
    currentRole === "manufacturer" ? "/manufacturer" :
    currentRole === "designer" ? "/designer" :
    currentRole === "business" ? "/business" :
    session?.user ? "/onboarding" : null;

  const dashboardLabel =
    currentRole === "manufacturer" ? "Manufacturer Dashboard" :
    currentRole === "designer" ? "Designer Dashboard" :
    currentRole === "business" ? "Business Dashboard" :
    "Get Started";

  // Only show loading if we have no server data AND client is still fetching
  const roleLoading = session?.user && currentRole === null;

  // ── Desktop signed-in cluster ──────────────────────────────────────────────
  const signedInActions = (
    <div className="flex items-center gap-2">
      {/* Dashboard pill */}
      {dashboardHref && (
        <Link
          href={roleLoading ? "#" : dashboardHref}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1.5",
            roleLoading && "pointer-events-none opacity-60 w-36"
          )}
        >
          {roleLoading
            ? <Loader2 className="size-3.5 animate-spin" />
            : <LayoutDashboard className="size-3.5" />
          }
          {!roleLoading && dashboardLabel}
        </Link>
      )}

      {/* Sign out */}
      <Button
        id="nav-signout-btn"
        variant="ghost"
        size="sm"
        disabled={isSigningOut}
        onClick={handleSignOut}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        {isSigningOut
          ? <Loader2 className="size-3.5 animate-spin" />
          : <LogOut className="size-3.5" />
        }
        Sign out
      </Button>
    </div>
  );

  // ── Desktop signed-out cluster ─────────────────────────────────────────────
  const signedOutActions = (
    <div className="flex items-center gap-2.5">
      <a
        id="nav-survey-link"
        href="https://docs.google.com/forms/d/e/1FAIpQLSfnqzq5UKUFp_rlQgw7518s-6Gi9Ryu4rXV316FxmEZSeI8HQ/viewform"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden items-center gap-1.5 px-2 text-xs text-muted-foreground transition-colors hover:text-foreground xl:inline-flex"
      >
        Take our survey
        <ArrowUpRight className="size-3.5" />
      </a>
      <Link
        href="/sign-in"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-3")}
      >
        Sign in
      </Link>
      <Link
        href="/sign-up"
        className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5 rounded-full px-4 shadow-sm")}
      >
        Get started
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
        scrolled || mobileOpen
          ? "border-border/70 bg-background/85 shadow-[0_8px_30px_-18px_rgba(0,0,0,0.3)] backdrop-blur-xl"
          : "border-transparent bg-transparent backdrop-blur-md"
      )}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <nav className="flex h-[68px] items-center justify-between">
          {/* Wordmark */}
          <Link href="/" className="flex shrink-0 items-center transition-opacity duration-200 hover:opacity-75">
            <Image src={LogoLight} alt="UNIFIÉE" className="h-40 w-auto dark:hidden" quality={100} priority />
            <Image src={LogoDark} alt="UNIFIÉE" className="h-40 w-auto hidden dark:block" quality={100} priority />
          </Link>

          {/* Desktop center links */}
          <div className="hidden items-center gap-1 rounded-full border border-border/50 bg-muted/35 p-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-[13px] transition-colors duration-200",
                  pathname === link.href
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle />
            {isLoading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : session?.user ? (
              signedInActions
            ) : (
              signedOutActions
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileOpen((o) => !o)}
              className="flex size-9 items-center justify-center rounded-full border border-border/70 bg-background/70 transition-colors hover:bg-muted"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileOpen ? "close" : "menu"}
                  initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                  transition={{ duration: 0.16 }}
                  className="flex"
                >
                  {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </nav>

        {/* Mobile drawer */}
        <div id="mobile-navigation" className="lg:hidden">
          <AnimatePresence initial={false}>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="border-t border-border/60 pb-5 pt-3">
                  <div className="flex flex-col">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "rounded-xl px-3 py-3 text-sm transition-colors",
                          pathname === link.href
                            ? "bg-muted/70 font-medium text-foreground"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4">
                    {isLoading ? null : session?.user ? (
                      <>
                        {dashboardHref && (
                          <Link
                            href={roleLoading ? "#" : dashboardHref}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              buttonVariants({ variant: "outline" }),
                              "w-full justify-center gap-2 rounded-xl",
                              roleLoading && "pointer-events-none opacity-60"
                            )}
                          >
                            {roleLoading
                              ? <Loader2 className="size-3.5 animate-spin" />
                              : <LayoutDashboard className="size-3.5" />
                            }
                            {!roleLoading && dashboardLabel}
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          disabled={isSigningOut}
                          className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-center gap-2")}
                        >
                          {isSigningOut
                            ? <Loader2 className="size-3.5 animate-spin" />
                            : <LogOut className="size-3.5" />
                          }
                          Sign out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/sign-up"
                          onClick={() => setMobileOpen(false)}
                          className={cn(buttonVariants({ variant: "default" }), "w-full justify-center gap-2 rounded-xl")}
                        >
                          Get started
                          <ArrowRight className="size-4" />
                        </Link>
                        <Link
                          href="/sign-in"
                          onClick={() => setMobileOpen(false)}
                          className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center rounded-xl")}
                        >
                          Sign in
                        </Link>
                        <a
                          href="https://docs.google.com/forms/d/e/1FAIpQLSfnqzq5UKUFp_rlQgw7518s-6Gi9Ryu4rXV316FxmEZSeI8HQ/viewform"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Take our survey
                          <ArrowUpRight className="ml-1 inline size-3.5" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
