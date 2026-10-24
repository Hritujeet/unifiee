import React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — UNIFIÉE",
  description:
    "Read UNIFIÉE's Privacy Policy. Learn how we collect, use, and protect your personal information when you interact with our B2B packaging procurement platform.",
};

export default function PrivacyPolicyPage() {
    return (
        <div className="container mx-auto max-w-4xl px-6 py-20 md:py-32">
            <article className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-heading prose-a:text-primary">
                <h1>UNIFIÉE Privacy Policy</h1>
                <p className="text-muted-foreground italic">Last Updated: 25 September 2026</p>

                <p>
                    UNIFIÉE (“UNIFIÉE”, “we”, “us”, or “our”) respects your privacy and is committed to handling personal information responsibly. This Privacy Policy explains how information may be collected, used, and protected when you visit or interact with the UNIFIÉE website and related services.
                </p>

                <p>
                    UNIFIÉE is currently an early-stage technology-enabled B2B platform being developed to simplify packaging procurement and related sourcing for food and beverage businesses.
                </p>

                <h2>1. Information We May Collect</h2>
                <p>We only seek information that is reasonably relevant to the purpose for which it is collected.</p>
                <ul>
                    <li>Name</li>
                    <li>Email address</li>
                    <li>Phone number or other contact details</li>
                    <li>Business or organization name</li>
                    <li>Business-related information you voluntarily provide</li>
                    <li>Information submitted through enquiry, feedback, beta-registration, or other forms</li>
                    <li>Technical information associated with your visit, such as browser/device information and basic usage information, where provided through our hosting or website infrastructure</li>
                </ul>

                <h2>2. How We Use Information</h2>
                <p>We do not intend to use personal information for purposes unrelated to the interaction in which it was provided without an appropriate legal basis or consent where required.</p>
                <ul>
                    <li>Respond to enquiries and requests</li>
                    <li>Communicate with prospective users, businesses, vendors, or partners</li>
                    <li>Understand the packaging procurement requirements of F&amp;B businesses</li>
                    <li>Conduct product validation and beta testing</li>
                    <li>Improve and develop UNIFIÉE</li>
                    <li>Facilitate potential packaging procurement or related business interactions</li>
                    <li>Maintain website security and functionality</li>
                    <li>Meet applicable legal or regulatory requirements</li>
                </ul>

                <h2>3. Information Sharing</h2>
                <p>UNIFIÉE does not sell personal information.</p>
                <p>Information may be shared with relevant service providers or third parties where reasonably necessary to operate, develop, secure, or provide UNIFIÉE&apos;s services.</p>
                <p>Third parties receiving information may process it according to their own applicable privacy policies and terms.</p>
                <ul>
                    <li>Website hosting and infrastructure providers</li>
                    <li>Form, communication, analytics, or other software services used by UNIFIÉE</li>
                    <li>Packaging manufacturers, suppliers, or other business partners where sharing is necessary to respond to a user&apos;s request or facilitate a requested service</li>
                    <li>Legal, regulatory, or governmental authorities where disclosure is required by applicable law</li>
                </ul>

                <h2>4. Data Retention</h2>
                <p>We retain personal information only for as long as reasonably necessary for the purpose for which it was collected, to provide or improve our services, to maintain appropriate records, or where required by applicable law.</p>
                <p>When information is no longer reasonably required, we may delete, anonymize, or otherwise dispose of it, subject to technical, legal, or operational requirements.</p>

                <h2>5. Data Security</h2>
                <p>We take reasonable technical and organizational measures intended to protect information from unauthorized access, misuse, alteration, disclosure, or destruction.</p>
                <p>However, no internet-based service can guarantee absolute security.</p>
                <p>UNIFIÉE is currently an early-stage product and its infrastructure and security practices may evolve as the platform develops.</p>

                <h2>6. Children&apos;s Privacy</h2>
                <p>UNIFIÉE is primarily intended as a B2B service for businesses and their representatives.</p>
                <p>We do not knowingly seek personal information from children for purposes unrelated to the operation or development of our services.</p>
                <p>Where applicable law requires parental or lawful-guardian consent for processing a child&apos;s personal data, UNIFIÉE will seek to comply with the applicable requirements.</p>
                <p>If you believe that personal information relating to a child has been provided to UNIFIÉE in circumstances where it should not have been, please contact us so that we can review the matter.</p>

                <h2>7. Third-Party Services and Hosting</h2>
                <p>The UNIFIÉE website may use third-party infrastructure and service providers to host, operate, secure, or improve the website and related functionality.</p>
                <p>Our current website may be hosted using Vercel. Vercel separately describes how it processes information through its services in its own Privacy Notice and Terms of Service.</p>
                <p>Third-party services used by UNIFIÉE may therefore have their own privacy policies and terms.</p>

                <h2>8. Your Choices and Requests</h2>
                <p>Depending on applicable law, you may have rights concerning your personal information, including the ability to request information about, correction of, or deletion of personal information held by us.</p>
                <p>To make a privacy-related request, contact us using the details provided below.</p>
                <p>We may need to verify a request before acting on it.</p>

                <h2>9. Changes to This Privacy Policy</h2>
                <p>UNIFIÉE may update this Privacy Policy from time to time as the product, technology, or applicable legal requirements develop.</p>
                <p>The updated version will be published on this page with a revised “Last Updated” date.</p>

                <h2>10. Contact Us</h2>
                <p>For questions, concerns, or requests relating to this Privacy Policy or the handling of personal information, contact:</p>
                
                <p>
                    <strong>UNIFIÉE</strong><br />
                    Email: <a href="mailto:teamunifiee@gmail.com">teamunifiee@gmail.com</a>
                </p>
            </article>
        </div>
    )
}
