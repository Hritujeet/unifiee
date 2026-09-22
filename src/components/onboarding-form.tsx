"use client";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldLabel,
    FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useState } from 'react';
import VendorOnboardingForm from './vendor-onboarding-form';
import BusinessOnboardingForm from './business-onboarding-form';
import { FadeIn, FadeInItem, StaggerContainer } from "./animations";

const options = [
    {
        value: "vendor",
        title: "I'm a Vendor",
        badge: "Supplier · Manufacturer · Printer",
        description: "Join UNIFIÉE's verified supplier network. Get discovered by F&B brands actively looking for packaging partners.",
        cta: "List your business, services, and capabilities — and let clients come to you.",
    },
    {
        value: "fb-business",
        title: "I'm an F&B Business",
        badge: "Café · Restaurant · Cloud Kitchen",
        description: "Source the right packaging for your brand — faster, smarter, and from verified vendors only.",
        cta: "Tell us about your business and start connecting with the right suppliers.",
    },
]

const OnboardingForm = () => {
    const [tab, setTab] = useState<string>("")
    const [FormComponent, setFormComponent] = useState<React.ReactNode | null>(null)

    useEffect(() => {
        if (tab === "vendor") {
            setFormComponent(<VendorOnboardingForm />)
        } else if (tab === "fb-business") {
            setFormComponent(<BusinessOnboardingForm />)
        } else {
            setFormComponent(null)
        }
    }, [tab])

    return (
        <section className="min-h-screen flex flex-col items-center justify-start py-20 px-4 sm:px-8">

            {/* Header */}
            <FadeIn delay={0.1} className="text-center mb-14 max-w-2xl">
                <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-4">
                    — Join the network —
                </p>
                <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
                    Who are you joining as?
                </h1>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                    UNIFIÉE connects <span className="text-foreground font-medium">F&B brands</span> with{" "}
                    <span className="text-foreground font-medium">packaging suppliers</span>. Pick the path that fits you.
                </p>
            </FadeIn>

            {/* Cards */}
            <StaggerContainer delayChildren={0.2} staggerChildren={0.1} className="w-full max-w-2xl">
                <RadioGroup
                    value={tab}
                    onValueChange={setTab}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full"
                >
                    {options.map((opt) => {
                        const selected = tab === opt.value
                        return (
                            <FadeInItem key={opt.value} className="h-full">
                                <FieldLabel
                                    htmlFor={opt.value}
                                    className={`cursor-pointer transition-all duration-200 border rounded-2xl overflow-hidden p-0 block h-full ${selected
                                        ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-md"
                                        : "border-border hover:border-primary/40 hover:bg-muted/40"
                                        }`}
                                >
                                    <Field orientation="horizontal" className="p-0 h-full">
                                        <FieldContent className="px-6 py-6 gap-2 h-full justify-start">
                                            <FieldTitle className="text-base font-semibold mt-0.5">
                                                {opt.title}
                                            </FieldTitle>

                                            <p className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase -mt-1">
                                                {opt.badge}
                                            </p>

                                            <FieldDescription className="text-xs leading-relaxed">
                                                {opt.description}
                                            </FieldDescription>
                                        </FieldContent>
                                        <RadioGroupItem value={opt.value} id={opt.value} className="hidden" />
                                    </Field>
                                </FieldLabel>
                            </FadeInItem>
                        )
                    })}
                </RadioGroup>
            </StaggerContainer>

            {/* Prompt */}
            {!tab && (
                <FadeIn delay={0.4} className="mt-8">
                    <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase animate-pulse">
                        ↑ select one to continue
                    </p>
                </FadeIn>
            )}

            {/* Divider + form label */}
            {tab && (
                <div key={tab} className="mt-12 w-full max-w-2xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-px flex-1 bg-border" />
                        <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                            {tab === "vendor" ? "Vendor Registration" : "Business Registration"}
                        </p>
                        <div className="h-px flex-1 bg-border" />
                    </div>
                    {FormComponent}
                </div>
            )}
        </section>
    )
}

export default OnboardingForm