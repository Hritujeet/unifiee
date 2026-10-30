import type { Metadata } from "next";
import { AdaptivePackagingSection } from "@/components/site/landing/adaptive-packaging-section";
import { CapabilitiesSection } from "@/components/site/landing/capabilities-section";
import { CtaSection } from "@/components/site/landing/cta-section";
import { DashboardsSection } from "@/components/site/landing/dashboards-section";
import { HeroSection } from "@/components/site/landing/hero-section";
import { ChaosStatementSection, ProblemSection } from "@/components/site/landing/problem-sections";
import { EarlyFeedbackSection, WhyUnifieeSection } from "@/components/site/landing/why-section";

export const metadata: Metadata = {
  title: "UNIFIÉE — One System | From Requirement to Delivery",
  description:
    "UNIFIÉE is an intelligent B2B operating layer that connects the fragmented decisions, suppliers, and workflows behind food and beverage packaging operations.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-clip">
      <HeroSection />
      <ProblemSection />
      <ChaosStatementSection />
      <CapabilitiesSection />
      <AdaptivePackagingSection />
      <DashboardsSection />
      <WhyUnifieeSection />
      <EarlyFeedbackSection />
      <CtaSection />
    </div>
  );
}
