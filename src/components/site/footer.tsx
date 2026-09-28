import Link from "next/link";
import Image from "next/image";
import LogoLight from "@/img/LogoLight.png";
import LogoDark from "@/img/LogoDark.png";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <Link href="/" className="inline-block hover:opacity-80 transition-opacity mb-4">
              <Image src={LogoLight} alt="UNIFIÉE" className="h-40 w-auto dark:hidden" quality={100} />
              <Image src={LogoDark} alt="UNIFIÉE" className="h-40 w-auto hidden dark:block" quality={100} />
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              An intelligent procurement platform connecting buyers with vendor
              networks. Unified workflows. One system. Currently in development.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-6 md:gap-8">
            {[
              { href: "/", label: "Home" },
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
              { href: "/faq", label: "FAQ" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfnqzq5UKUFp_rlQgw7518s-6Gi9Ryu4rXV316FxmEZSeI8HQ/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Survey
            </a>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 UNIFIÉE. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
