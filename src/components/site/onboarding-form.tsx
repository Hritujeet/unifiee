"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldLabel,
    FieldTitle,
} from "@/components/ui/field";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import VendorOnboardingForm from "./vendor-onboarding-form";
import BusinessOnboardingForm from "./business-onboarding-form";
import { ArrowLeft } from "lucide-react";

const customEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

const options = [
    {
        value: "vendor",
        title: "I'm a Vendor",
        badge: "Supplier · Manufacturer · Printer",
        description:
            "Join UNIFIÉE's verified supplier network. Get discovered by F&B brands actively looking for packaging partners.",
        cta: "List your business, services, and capabilities — and let clients come to you.",
    },
    {
        value: "fb-business",
        title: "I'm an F&B Business",
        badge: "Café · Restaurant · Cloud Kitchen",
        description:
            "Source the right packaging for your brand — faster, smarter, and from verified vendors only.",
        cta: "Tell us about your business and start connecting with the right suppliers.",
    },
];

type Step = "select" | "vendor" | "fb-business";

// Shared screen transition variants
const screenVariants = {
    enter: (direction: "left" | "right") => ({
        opacity: 0,
        x: direction === "right" ? 60 : -60,
        filter: "blur(8px)",
        scale: 0.97,
    }),
    center: {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        scale: 1,
    },
    exit: (direction: "left" | "right") => ({
        opacity: 0,
        x: direction === "right" ? -60 : 60,
        filter: "blur(8px)",
        scale: 0.97,
    }),
};

const OnboardingForm = () => {
    const [step, setStep] = useState<Step>("select");
    const [selectedOption, setSelectedOption] = useState<string>("");
    // direction: "right" = going forward, "left" = going back
    const [direction, setDirection] = useState<"left" | "right">("right");

    const handleSelect = (value: string) => {
        setSelectedOption(value);
    };

    const handleContinue = () => {
        if (!selectedOption) return;
        setDirection("right");
        setStep(selectedOption as Step);
    };

    const handleBack = () => {
        setDirection("left");
        setStep("select");
    };

    return (
        <section className="min-h-screen flex flex-col items-center justify-start py-20 px-4 sm:px-8 overflow-hidden">
            {/* Persistent Heading */}
            <motion.div
                initial={{ opacity: 0, y: 20, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.8, delay: 0.1, ease: customEase }}
                className="text-center mb-14 max-w-2xl"
            >
                <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-4">
                    — Join the network —
                </p>
                <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
                    {step === "select" ? "Who are you joining as?" : step === "vendor" ? "Vendor Registration" : "Business Registration"}
                </h1>
                <AnimatePresence mode="wait">
                    {step === "select" && (
                        <motion.p
                            key="subtitle"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.4, ease: customEase }}
                            className="mt-4 text-base text-muted-foreground leading-relaxed"
                        >
                            UNIFIÉE connects{" "}
                            <span className="text-foreground font-medium">F&B brands</span>{" "}
                            with{" "}
                            <span className="text-foreground font-medium">packaging suppliers</span>
                            . Pick the path that fits you.
                        </motion.p>
                    )}
                    {step !== "select" && (
                        <motion.p
                            key="form-subtitle"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.4, ease: customEase }}
                            className="mt-4 text-base text-muted-foreground leading-relaxed"
                        >
                            {step === "vendor"
                                ? "Fill in your details to join the verified supplier network."
                                : "Tell us about your F&B business to get started."}
                        </motion.p>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Screen Content — animated swap */}
            <div className="w-full max-w-2xl relative">
                <AnimatePresence mode="wait" custom={direction}>
                    {step === "select" && (
                        <motion.div
                            key="select"
                            custom={direction}
                            variants={screenVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.55, ease: customEase }}
                        >
                            {/* Radio Cards */}
                            <RadioGroup
                                value={selectedOption}
                                onValueChange={handleSelect}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full"
                            >
                                {options.map((opt) => {
                                    const selected = selectedOption === opt.value;
                                    return (
                                        <FieldLabel
                                            key={opt.value}
                                            htmlFor={opt.value}
                                            className={`cursor-pointer transition-all duration-300 border rounded-2xl overflow-hidden p-0 block h-full ${
                                                selected
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
                                                <RadioGroupItem
                                                    value={opt.value}
                                                    id={opt.value}
                                                    className="hidden"
                                                />
                                            </Field>
                                        </FieldLabel>
                                    );
                                })}
                            </RadioGroup>

                            {/* Continue Button / Prompt */}
                            <AnimatePresence mode="wait">
                                {!selectedOption ? (
                                    <motion.p
                                        key="prompt"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.35, ease: customEase }}
                                        className="mt-8 text-center text-xs font-mono text-muted-foreground tracking-widest uppercase animate-pulse"
                                    >
                                        ↑ select one to continue
                                    </motion.p>
                                ) : (
                                    <motion.div
                                        key="continue-btn"
                                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.97 }}
                                        transition={{ duration: 0.4, ease: customEase }}
                                        className="mt-8 flex justify-center"
                                    >
                                        <button
                                            onClick={handleContinue}
                                            className="px-8 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold tracking-wide shadow-md hover:opacity-90 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                                        >
                                            Continue →
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {step === "vendor" && (
                        <motion.div
                            key="vendor-form"
                            custom={direction}
                            variants={screenVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.55, ease: customEase }}
                        >
                            <BackButton onBack={handleBack} />
                            <VendorOnboardingForm />
                        </motion.div>
                    )}

                    {step === "fb-business" && (
                        <motion.div
                            key="business-form"
                            custom={direction}
                            variants={screenVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.55, ease: customEase }}
                        >
                            <BackButton onBack={handleBack} />
                            <BusinessOnboardingForm />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};

function BackButton({ onBack }: { onBack: () => void }) {
    return (
        <motion.button
            onClick={onBack}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: customEase }}
            className="flex items-center gap-2 mb-8 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group cursor-pointer"
        >
            <ArrowLeft
                size={15}
                className="group-hover:-translate-x-1 transition-transform duration-200"
            />
            <span className="font-mono tracking-wide uppercase text-xs">Back to selection</span>
        </motion.button>
    );
}

export default OnboardingForm;