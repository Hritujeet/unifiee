import type { Metadata } from "next";
import { AboutContent } from "@/components/site/about-content";

export const metadata: Metadata = {
  title: "About — UNIFIÉE",
  description:
    "UNIFIÉE brings packaging decisions, suppliers, design, and order coordination into one connected workflow for F&B businesses.",
};

export default function AboutPage() {
  return <AboutContent />;
}
