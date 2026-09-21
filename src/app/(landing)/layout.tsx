import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function LandingLayout({ children }: LayoutProps<"/">) {
    return (
        <main className="min-h-full flex flex-col bg-background text-foreground font-sans">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
        </main>
    );
}