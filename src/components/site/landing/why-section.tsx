import { Quote } from "lucide-react";
import { FadeIn, FadeInItem, StaggerContainer } from "@/components/site/animations";

const whyCards = [
  {
    title: "Turn an idea into a clear requirement.",
    body: "Get help thinking through packaging formats, materials, and trade-offs, then shape the brief into something a supplier can respond to.",
  },
  {
    title: "Find partners by what matters to you.",
    body: "Explore supplier options around practical criteria like MOQ, lead time, location, and price tier — not just a name in a contact list.",
  },
  {
    title: "Keep the order moving in one place.",
    body: "Bring requirements, offers, approvals, and order progress into a clearer workflow from the first brief through delivery.",
  },
  {
    title: "Adapt packaging without losing your identity.",
    body: "Build seasonal and promotional variations around a consistent core brand, rather than treating every new moment like a full redesign.",
  },
];

const conversationPrompts = [
  ["Packaging decisions", "What do you need to know before choosing a format or material?"],
  ["Finding suppliers", "Which details make it difficult to compare one supplier with another?"],
  ["Managing orders", "Where does coordination take the most time once an order is underway?"],
];

export function WhyUnifieeSection() {
  return (
    <section className="border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="mb-12 max-w-2xl">
          <p className="mb-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">Why UNIFIÉE</p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            The path from requirement to production is unnecessarily complicated.
          </h2>
        </FadeIn>

        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {whyCards.map((card, index) => (
            <FadeInItem
              key={card.title}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl border border-border/70 bg-card/50 p-6 transition-colors duration-300 hover:border-primary/30 hover:bg-card/80 sm:p-7"
            >
              <p className="font-mono text-[10px] tracking-[0.18em] text-primary uppercase">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-6 text-lg font-semibold tracking-tight text-foreground">{card.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
            </FadeInItem>
          ))}
          <FadeInItem className="rounded-2xl border border-border/70 bg-card/50 p-7 sm:col-span-2 lg:col-span-4 lg:grid lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-12">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              One connected platform, not another isolated service.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground lg:mt-0">
              Bring decisions, design, sourcing, and order coordination into one workflow. Use the parts that help your business, and keep the process connected as your needs change.
            </p>
          </FadeInItem>
        </StaggerContainer>
      </div>
    </section>
  );
}

export function EarlyFeedbackSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="mb-12">
          <p className="mb-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">
            In conversation
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Built around the realities of running an F&amp;B business.
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            We&apos;re speaking with early F&amp;B teams now. This space is reserved for their feedback, shared with permission—not invented testimonials.
          </p>
        </FadeIn>
        <StaggerContainer className="grid gap-4 md:grid-cols-3">
          {conversationPrompts.map(([topic, question]) => (
            <FadeInItem
              key={topic}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="flex min-h-52 flex-col justify-between rounded-2xl border border-border/70 bg-card/40 p-7 transition-colors duration-300 hover:border-primary/30 hover:bg-card/80"
            >
              <Quote className="size-5 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium leading-relaxed text-foreground">{question}</p>
                <p className="mt-4 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">{topic}</p>
              </div>
            </FadeInItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
