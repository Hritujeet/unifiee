import type { Metadata } from "next";
import { ContactContent } from "@/components/site/contact-content";

export const metadata: Metadata = {
  title: "Contact — UNIFIÉE",
  description:
    "Talk to the UNIFIÉE team about packaging procurement, vendor partnerships, or building a more connected F&B workflow.",
};

export default function ContactPage() {
  return <ContactContent />;
}
