export interface InAppHelpDoc {
    id: string;
    title: string;
    category: "business" | "vendor" | "designer" | "general";
    targetRole?: "business" | "manufacturer" | "designer";
    route: string;
    content: string;
}

export const IN_APP_HELP_DOCS: InAppHelpDoc[] = [
    {
        id: "help-business-post-requirement",
        title: "How to post a custom packaging requirement",
        category: "business",
        targetRole: "business",
        route: "/business/requirements/new",
        content: `As an F&B business buyer, you can post packaging requirements to receive quotes and connect with verified suppliers.
1. Navigate to the Business Dashboard and click on 'New Requirement' or visit /business/requirements/new.
2. Use the AI Requirement Builder by describing your packaging need in plain language (e.g., 'Need 5000 double-wall coffee cups 8oz for our cafe in Bengaluru').
3. The AI will extract specifications including packaging use, type, quantity, size, material, and delivery timeframe.
4. Review, adjust the fields, and click 'Submit Requirement'.
5. Once submitted, matching suppliers will be retrieved and notified to submit quotes.`,
    },
    {
        id: "help-business-track-orders",
        title: "How to track packaging orders and milestones",
        category: "business",
        targetRole: "business",
        route: "/business/orders",
        content: `To review current and past packaging orders:
1. Open the 'Orders' section from the Business sidebar (/business/orders).
2. Each order displays its current fulfillment status: Submitted, Confirmed, In Production, Shipped, or Delivered.
3. Click 'View Details' on any order to see production milestone progress, shipping tracking numbers, carrier details, and invoices.`,
    },
    {
        id: "help-business-hire-designer",
        title: "How to hire a freelance packaging designer",
        category: "business",
        targetRole: "business",
        route: "/business/designers",
        content: `To hire specialized packaging and label designers:
1. Go to 'Find Designers' in the Business dashboard (/business/designers).
2. Browse verified packaging designers by specialty: Food boxes, Paper cups, Corrugated packaging, Labels, or 3D mockups.
3. Review their portfolios, starting rates, and client reviews.
4. Select a designer service gig and click 'Hire Service' to start the project. Track ongoing design milestones under /business/hired-services.`,
    },
    {
        id: "help-vendor-publish-offering",
        title: "How to publish packaging catalog offerings",
        category: "vendor",
        targetRole: "manufacturer",
        route: "/manufacturer/publish-offering",
        content: `Suppliers and manufacturers can list standardized packaging products in the UNIFIÉE B2B catalog:
1. Go to the Manufacturer portal and click '+ Post Offering' or visit /manufacturer/publish-offering.
2. Enter the title, packaging category, description, and unit of measure (e.g. piece, pack, carton).
3. Set volume pricing slabs/tiers with minimum order quantities (MOQ).
4. Specify production lead times (minimum and maximum days), shipping terms, and location.
5. Use the inline AI assist buttons to refine your title and polish the technical description.
6. Click 'Publish Offering' to make it live for business buyers to browse.`,
    },
    {
        id: "help-vendor-manage-orders",
        title: "How to process vendor orders and milestones",
        category: "vendor",
        targetRole: "manufacturer",
        route: "/manufacturer/order-dashboard",
        content: `To manage incoming buyer purchase orders:
1. Navigate to 'Order Management' in the vendor portal (/manufacturer/order-dashboard).
2. Review orders in 'Submitted' or 'Confirmed' status.
3. Update production milestones as work progresses: Artwork Approved, Raw Material Sourced, In Production, Quality Check Passed, Dispatched, Delivered.
4. Upload dispatch details and shipment tracking codes so the buyer stays informed.`,
    },
    {
        id: "help-designer-create-service",
        title: "How to list packaging design services (gigs)",
        category: "designer",
        targetRole: "designer",
        route: "/designer/services",
        content: `Graphic designers can sell packaging and branding design services:
1. Open the Designer Studio and go to 'Services & Expertise' (/designer/services).
2. Click 'Add a Service' to open the gig creator modal.
3. Enter your service title (e.g. 'Artisanal Coffee Bag & Label Packaging Design').
4. Select category: Packaging design, Label design, Brand identity, 3D rendering, or Print-ready artwork.
5. Choose your pricing model (per project, per design, or hourly), price in INR, turnaround days, and included revisions.
6. Specify concrete deliverables (e.g. Print-ready PDF, Die-line template, 3D Mockup).
7. Use the AI Gig Creator helper to draft compelling service descriptions and FAQ suggestions.`,
    },
    {
        id: "help-designer-profile-setup",
        title: "How to set up your designer portfolio and profile",
        category: "designer",
        targetRole: "designer",
        route: "/designer/profile",
        content: `To optimize your designer studio profile and attract brand inquiries:
1. Navigate to 'My Profile' (/designer/profile).
2. Add your headline, years of experience, and a professional bio.
3. Select your packaging design specializations and software tools (Illustrator, Photoshop, Blender, CAD).
4. Link your portfolio (Behance, Dribbble, Website) and upload high-resolution work samples.
5. Set your availability status: Available, Limited, or Unavailable.`,
    },
    {
        id: "help-designer-earnings",
        title: "How designer earnings and payment policies work",
        category: "designer",
        targetRole: "designer",
        route: "/designer/earnings",
        content: `To monitor your packaging design revenue:
1. Visit the 'Earnings' page in the designer portal (/designer/earnings).
2. Review your total earnings, available balance, and payment activity from hired services.
3. Design projects are tracked via hired service milestones. Once a business confirms delivery of your artwork deliverables, payments are cleared to your registered payout account.`,
    },
];
