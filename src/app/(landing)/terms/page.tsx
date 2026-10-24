import React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions — UNIFIÉE",
  description:
    "Review UNIFIÉE's Terms & Conditions governing your access to and use of the UNIFIÉE platform, including packaging procurement workflows and beta services.",
};

export default function TermsAndConditionsPage() {
    return (
        <div className="container mx-auto max-w-4xl px-6 py-20 md:py-32">
            <article className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-heading prose-a:text-primary">
                <h1>UNIFIÉE Terms & Conditions</h1>
                <p className="text-muted-foreground italic">Last Updated: 25 September 2026</p>

                <p>
                    These Terms & Conditions (“Terms”) govern your access to and use of the UNIFIÉE website and any related beta, prototype, information, or services made available through it. By accessing or using UNIFIÉE, you acknowledge that you have read and understood these Terms and agree to comply with them.
                </p>

                <p>
                    UNIFIÉE is currently an early-stage technology-enabled B2B platform being developed to simplify packaging procurement and related sourcing for food and beverage businesses. Features, workflows, and services may change as the platform develops.
                </p>

                <h2>1. Use of the Website</h2>
                <ul>
                    <li>You may use the website only for lawful purposes and in accordance with these Terms.</li>
                    <li>You must not use the website to interfere with its operation, attempt unauthorized access, introduce malicious code, or knowingly misuse any functionality.</li>
                    <li>You are responsible for the accuracy of information you voluntarily submit through the website.</li>
                </ul>

                <h2>2. Beta and Prototype Status</h2>
                <ul>
                    <li>UNIFIÉE may currently provide prototype, beta, demonstration, or validation-stage functionality.</li>
                    <li>Features may be incomplete, modified, suspended, or discontinued without prior notice.</li>
                    <li>Information presented through a prototype or demonstration should not be treated as a guarantee that a particular feature, product, supplier, price, delivery timeline, or service will remain available.</li>
                </ul>

                <h2>3. Packaging Procurement and Third-Party Suppliers</h2>
                <ul>
                    <li>UNIFIÉE may facilitate connections or interactions between F&amp;B businesses and packaging manufacturers, suppliers, designers, logistics providers, or other third parties.</li>
                    <li>Unless expressly stated otherwise, UNIFIÉE does not itself manufacture packaging products.</li>
                    <li>Third-party suppliers are responsible for the products, offerings, specifications, quality, availability, delivery, warranties, and other commitments they provide.</li>
                    <li>Users should independently review and confirm commercial terms with the relevant supplier before entering into a transaction.</li>
                </ul>

                <h2>4. No Guarantee of Commercial Outcomes</h2>
                <ul>
                    <li>UNIFIÉE does not guarantee that a user will receive a particular offering, supplier match, price, product, minimum order quantity, delivery date, or commercial outcome.</li>
                    <li>Any examples, estimates, demonstrations, or indicative information shown on the website are provided for informational purposes unless expressly identified as a confirmed commercial offer.</li>
                </ul>

                <h2>5. User-Submitted Information</h2>
                <ul>
                    <li>You retain responsibility for information, specifications, designs, business details, or other material that you submit to UNIFIÉE.</li>
                    <li>You should not submit confidential or sensitive information unless it is reasonably necessary for the relevant interaction.</li>
                    <li>By submitting information, you confirm that you have the right to provide that information and that doing so does not knowingly violate the rights of another person or organization.</li>
                </ul>

                <h2>6. Intellectual Property</h2>
                <ul>
                    <li>Unless otherwise stated, the UNIFIÉE name, branding, website design, original text, graphics, software, interface elements, and other original materials made available through the website are owned by or used by UNIFIÉE under applicable rights.</li>
                    <li>You may not copy, reproduce, modify, distribute, reverse engineer, or commercially exploit UNIFIÉE materials without appropriate authorization, except where permitted by applicable law.</li>
                    <li>Third-party names, logos, trademarks, and other materials remain the property of their respective owners.</li>
                </ul>

                <h2>7. User-Submitted Feedback</h2>
                <ul>
                    <li>If you voluntarily provide suggestions, feedback, ideas, or product improvement recommendations to UNIFIÉE, you permit UNIFIÉE to use that feedback to evaluate and improve the platform, subject to applicable law and the UNIFIÉE Privacy Policy.</li>
                    <li>This does not transfer ownership of your independently developed intellectual property to UNIFIÉE.</li>
                </ul>

                <h2>8. Payments and Transactions</h2>
                <ul>
                    <li>If UNIFIÉE introduces paid services, transaction processing, commissions, subscriptions, or other commercial arrangements, additional terms may apply.</li>
                    <li>Unless expressly stated by UNIFIÉE, submitting an enquiry or requesting a supplier connection does not by itself create a binding purchase contract with UNIFIÉE.</li>
                </ul>

                <h2>9. Third-Party Services and Links</h2>
                <ul>
                    <li>The website may contain links to or integrations with third-party services.</li>
                    <li>UNIFIÉE does not control third-party websites or services and is not responsible for their content, availability, terms, or privacy practices.</li>
                    <li>Your use of third-party services may be subject to their own terms and policies.</li>
                </ul>

                <h2>10. Availability and Changes</h2>
                <ul>
                    <li>UNIFIÉE may modify, suspend, or discontinue any part of the website or its functionality at any time.</li>
                    <li>We do not guarantee that the website will always be available, uninterrupted, error-free, or compatible with every device or browser.</li>
                </ul>

                <h2>11. Limitation of Liability</h2>
                <ul>
                    <li>To the extent permitted by applicable law, UNIFIÉE will not be responsible for indirect, incidental, special, consequential, or similar losses arising from use of, or inability to use, the website or third-party services.</li>
                    <li>Nothing in these Terms is intended to exclude or limit any liability that cannot lawfully be excluded or limited.</li>
                </ul>

                <h2>12. Indemnity</h2>
                <ul>
                    <li>To the extent permitted by applicable law, you agree to be responsible for losses or claims arising from your unlawful use of the website, violation of these Terms, or infringement of another party&apos;s rights through information or material you submit.</li>
                </ul>

                <h2>13. Privacy</h2>
                <ul>
                    <li>Use of personal information submitted through the UNIFIÉE website is governed by the UNIFIÉE Privacy Policy.</li>
                    <li>The Privacy Policy should be read together with these Terms.</li>
                </ul>

                <h2>14. Changes to These Terms</h2>
                <ul>
                    <li>UNIFIÉE may update these Terms as the platform, services, or applicable requirements develop.</li>
                    <li>The updated version will be published on this page with a revised “Last Updated” date.</li>
                    <li>Your continued use of the website after an update may constitute acceptance of the revised Terms to the extent permitted by applicable law.</li>
                </ul>

                <h2>15. Governing Law and Jurisdiction</h2>
                <ul>
                    <li>These Terms are intended to be governed by the laws applicable in India, subject to any mandatory legal rights or requirements that apply to a particular user or transaction.</li>
                    <li>Any dispute arising in connection with these Terms will be subject to the jurisdiction of the courts having appropriate jurisdiction under applicable law.</li>
                </ul>

                <h2>16. Contact</h2>
                <p>For questions regarding these Terms, contact:</p>
                <p>
                    <strong>UNIFIÉE</strong><br />
                    Email: <a href="mailto:teamunifiee@gmail.com">teamunifiee@gmail.com</a>
                </p>

                <hr className="my-8" />
                <p className="text-sm text-muted-foreground italic">
                    Note: These Terms are a general early-stage website/business draft and should be reviewed by a qualified legal professional before UNIFIÉE begins handling substantial transactions, payments, or sensitive customer data.
                </p>
            </article>
        </div>
    )
}
