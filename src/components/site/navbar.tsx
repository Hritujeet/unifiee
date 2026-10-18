"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useUserRoleStore } from "@/lib/stores/user-role-store";
import { Loader2, LogOut, Menu, X, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import LogoLight from "@/img/LogoLight.png";
import LogoDark from "@/img/LogoDark.png";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "./theme-toggle";

const navLinks = [
  { href: "/", label: "Home" },
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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
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
  const SignedInActions = () => (
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
  const SignedOutActions = () => (
    <div className="flex items-center gap-2">
      <a
        id="nav-survey-link"
        href="https://docs.google.com/forms/d/e/1FAIpQLSfnqzq5UKUFp_rlQgw7518s-6Gi9Ryu4rXV316FxmEZSeI8HQ/viewform"
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ variant: "secondary", size: "sm" })}
      >
        Take our Survey
      </a>
      <Link
        href="/sign-in"
        className={buttonVariants({ variant: "default", size: "sm" })}
      >
        Sign in
      </Link>
    </div>
  );

  return (
    <header
      className={cn(
        "sticky top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled || mobileOpen
          ? "bg-white/95 dark:bg-[#111111]/80 backdrop-blur-md border-b border-border shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] dark:shadow-none"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6">
        <nav className="h-16 flex items-center justify-between">
          {/* Wordmark */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Image src={LogoLight} alt="UNIFIÉE" className="h-40 w-auto dark:hidden" quality={100} priority />
            <Image src={LogoDark} alt="UNIFIÉE" className="h-40 w-auto hidden dark:block" quality={100} priority />
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
            <ThemeToggle />
            {isLoading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : session?.user ? (
              <SignedInActions />
            ) : (
              <SignedOutActions />
            )}
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
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
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
              {isLoading ? null : session?.user ? (
                <>
                  {/* Dashboard link */}
                  {dashboardHref && (
                    <Link
                      href={roleLoading ? "#" : dashboardHref}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "w-full justify-center gap-2",
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
                  {/* Sign out */}
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
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSfnqzq5UKUFp_rlQgw7518s-6Gi9Ryu4rXV316FxmEZSeI8HQ/viewform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-center")}
                  >
                    Take our Survey
                  </a>
                  <Link
                    href="/sign-in"
                    className={cn(buttonVariants({ variant: "default" }), "w-full justify-center")}
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
