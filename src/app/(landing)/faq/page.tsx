import React from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Link from "next/link"

const faqs = [
  {
    question: "What is UNIFIÉE?",
    answer: "UNIFIÉE is a technology-enabled B2B platform focused on making packaging procurement simpler for F&B businesses by connecting businesses with relevant packaging suppliers and related resources."
  },
  {
    question: "Who is UNIFIÉE for?",
    answer: "UNIFIÉE is primarily being developed for cafés, restaurants, cloud kitchens, food brands, and other F&B businesses that need packaging such as cups, boxes, containers, bags, or related custom packaging."
  },
  {
    question: "What problem is UNIFIÉE trying to solve?",
    answer: "F&B businesses often have to coordinate packaging sourcing, manufacturers, customization, design, pricing, and delivery separately. UNIFIÉE aims to make this process more organized and easier to navigate."
  },
  {
    question: "Does UNIFIÉE manufacture packaging?",
    answer: "No. UNIFIÉE is not currently a packaging manufacturer. The platform is designed to connect F&B businesses with relevant manufacturers, suppliers, designers, and other service providers."
  },
  {
    question: "Can I order packaging through UNIFIÉE?",
    answer: "The current product is in the beta/prototype and validation stage. Depending on the available workflow, UNIFIÉE may help users identify suppliers and facilitate a procurement conversation. Availability of specific ordering or transaction features may change as the platform develops."
  },
  {
    question: "Can UNIFIÉE provide custom-branded packaging?",
    answer: "UNIFIÉE is being developed to support packaging requirements that may include customization and branding. Exact customization options depend on the relevant supplier, product, quantity, materials, specifications, and design requirements."
  },
  {
    question: "How does UNIFIÉE match businesses with suppliers?",
    answer: "The current approach focuses on understanding a business's packaging requirements and identifying relevant suppliers based on factors such as product type, customization requirements, quantity, and other practical specifications. The matching process may evolve as the platform is developed."
  },
  {
    question: "Does UNIFIÉE guarantee the lowest price?",
    answer: "No. UNIFIÉE does not currently guarantee the lowest price. Pricing depends on the supplier, specifications, quantity, materials, customization, delivery requirements, and other commercial factors."
  },
  {
    question: "Does UNIFIÉE guarantee delivery?",
    answer: "Delivery arrangements depend on the relevant supplier or logistics provider. UNIFIÉE does not currently guarantee a particular delivery date unless a specific service agreement states otherwise."
  },
  {
    question: "Who is responsible for the quality of the packaging?",
    answer: "The relevant manufacturer or supplier is responsible for the products they provide, subject to the applicable commercial agreement. Users should review specifications, samples, quotations, and supplier terms before confirming an order."
  },
  {
    question: "Is UNIFIÉE currently a fully commercial platform?",
    answer: "UNIFIÉE is currently in an early-stage validation and building phase. Some features are prototypes or may still be under development, so the current website should not be interpreted as a representation that every planned feature is commercially available."
  },
  {
    question: "Do I need to create an account?",
    answer: "Account and registration requirements may depend on the specific feature being used. During the current beta stage, UNIFIÉE may collect basic information through forms or other user interactions to understand requirements and communicate with potential users."
  },
  {
    question: "What information does UNIFIÉE collect?",
    answer: (
        <>
            UNIFIÉE may collect information such as name, contact details, business information, packaging requirements, and information submitted through enquiries, feedback, beta-registration, or related forms. See the{" "}
            <Link href="/privacy" className="text-primary hover:underline underline-offset-4">UNIFIÉE Privacy Policy</Link>{" "}
            for more information.
        </>
    )
  },
  {
    question: "Is my information sold to third parties?",
    answer: (
        <>
            UNIFIÉE does not intend to sell personal information. Information may be shared with relevant service providers or business partners when reasonably necessary to provide or develop the service, or where required by applicable law. See the{" "}
            <Link href="/privacy" className="text-primary hover:underline underline-offset-4">Privacy Policy</Link>{" "}
            for details.
        </>
    )
  },
  {
    question: "Can I become a packaging supplier or partner?",
    answer: "UNIFIÉE is developing a supplier ecosystem and may work with packaging manufacturers, suppliers, designers, logistics providers, and other relevant businesses. Interested businesses can contact UNIFIÉE with their company and service details."
  },
  {
    question: "Can F&B businesses participate in the beta?",
    answer: "Yes. UNIFIÉE is currently validating and building the product with real-world F&B requirements. Businesses interested in participating can contact the team or use the available beta/enquiry form."
  },
  {
    question: "Is UNIFIÉE an AI company?",
    answer: "UNIFIÉE is a technology-enabled procurement platform. Technology and automation may be used to improve workflows, discovery, matching, and other parts of the experience, but the core objective is simplifying packaging procurement rather than offering AI as a standalone product."
  },
  {
    question: "Where is UNIFIÉE available?",
    answer: "UNIFIÉE is currently being developed for the Indian F&B ecosystem. Availability of specific suppliers, services, and delivery options depends on location and the current supplier network."
  },
  {
    question: "How can I contact UNIFIÉE?",
    answer: (
        <>
            For enquiries, beta participation, supplier partnerships, or other questions, contact the UNIFIÉE team at: <br/>
            Email: <a href="mailto:teamunifiee@gmail.com" className="text-primary hover:underline underline-offset-4">teamunifiee@gmail.com</a>
        </>
    )
  },
  {
    question: "Where can I read the legal policies?",
    answer: (
        <>
            The UNIFIÉE website provides a{" "}
            <Link href="/privacy" className="text-primary hover:underline underline-offset-4">Privacy Policy</Link>
            {" "}and{" "}
            <Link href="/terms" className="text-primary hover:underline underline-offset-4">Terms & Conditions</Link>. 
            These documents explain how information is handled and the terms governing use of the website and related services.
        </>
    )
  }
];

export default function FAQPage() {
    return (
        <div className="container mx-auto max-w-4xl px-6 py-20 md:py-32">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-heading font-bold tracking-tight">Frequently Asked Questions</h1>
                    <p className="text-lg text-muted-foreground">Current Beta / Prototype</p>
                </div>
                
                <p className="text-center text-muted-foreground">
                    UNIFIÉE is an early-stage technology-enabled B2B platform being developed to simplify packaging procurement and related sourcing for food and beverage businesses. The answers below describe the current concept and may evolve as the platform develops.
                </p>

                <div className="pt-8">
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <AccordionTrigger className="text-left font-semibold">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground leading-relaxed">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </div>
    )
}
