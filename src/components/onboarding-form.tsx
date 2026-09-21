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

const options = [
    {
        value: "vendor",
        title: "Vendor",
        description: "I wish to provide packaging services and join the supplier network.",
    },
    {
        value: "fb-business",
        title: "F&B Business",
        description: "I wish to procure packaging for my brand, restaurant, or café.",
    },
]

const OnboardingForm = () => {
    // Always controlled — starts as empty string (no selection)
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
            <div className="text-center mb-12 max-w-xl">
                <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-3">
                    Registration
                </p>
                <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
                    Register to UNIFIÉE
                </h1>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                    Tell us who you are so we can tailor your onboarding experience.
                </p>
            </div>

            {/* Role selector label */}
            <p className="text-sm font-medium text-foreground mb-4 self-start max-w-2xl w-full mx-auto">
                What best describes you?
            </p>

            {/* Cards */}
            <RadioGroup
                value={tab}
                onValueChange={setTab}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl"
            >
                {options.map((opt) => {
                    const selected = tab === opt.value
                    return (
                        <FieldLabel
                            key={opt.value}
                            htmlFor={opt.value}
                            className={`cursor-pointer transition-all duration-200 border rounded-xl overflow-hidden p-0 ${selected
                                ? "border-primary bg-primary/5 ring-1 ring-primary/30 shadow-sm"
                                : "border-border hover:border-primary/40 hover:bg-muted/40"
                                }`}
                        >
                            <Field orientation="horizontal" className="p-0">
                                <FieldContent className="px-6 py-6">
                                    <FieldTitle
                                        className={`text-base font-semibold transition-colors`}
                                    >
                                        {opt.title}
                                    </FieldTitle>
                                    <FieldDescription className="text-sm mt-1.5 leading-relaxed">
                                        {opt.description}
                                    </FieldDescription>
                                </FieldContent>
                                <RadioGroupItem value={opt.value} id={opt.value} className="hidden" />
                            </Field>
                        </FieldLabel>
                    )
                })}
            </RadioGroup>

            {!tab && (
                <p className="mt-6 text-xs font-mono text-muted-foreground tracking-widest uppercase animate-pulse">
                    Select one to continue ↑
                </p>
            )}

            {/* Sub-form area */}
            {FormComponent && (
                <div className="mt-10 w-full max-w-2xl">
                    {FormComponent}
                </div>
            )}
        </section>
    )
}

export default OnboardingForm