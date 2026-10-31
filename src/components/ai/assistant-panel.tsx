"use client";

import * as React from "react";
import {
    Sparkles,
    Bot,
    X,
    Send,
    Loader2,
    RotateCcw,
    HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiSourceChip } from "./ai-source-chip";
import { AiErrorState } from "./ai-error-state";

interface GroundedSource {
    id: string;
    title: string;
    url?: string;
    similarityScore?: number;
    snippet?: string;
}

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: GroundedSource[];
}

export interface AssistantPanelProps {
    role?: "business" | "manufacturer" | "designer" | "none";
    userName?: string;
}

export function AssistantPanel({ role = "business", userName }: AssistantPanelProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [input, setInput] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [remainingDaily, setRemainingDaily] = React.useState<number | null>(null);
    const abortControllerRef = React.useRef<AbortController | null>(null);
    const msgCounterRef = React.useRef(0);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of messages
    React.useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen, isLoading]);

    // Abort active stream on unmount
    React.useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    // Role-specific suggested starter questions
    const quickPrompts = React.useMemo(() => {
        if (role === "business") {
            return [
                "Find eco-friendly packaging suppliers for coffee pouches",
                "What's the status of my active requirements?",
                "How do I choose between kraft paper and stand-up pouches?",
                "How do I hire a verified packaging designer?",
            ];
        }
        if (role === "manufacturer") {
            return [
                "How do I publish a packaging offering?",
                "How do I optimize my offering title and specs?",
                "What are best practices for setting competitive MOQs?",
                "How do I update production milestones on orders?",
            ];
        }
        if (role === "designer") {
            return [
                "Help me write a compelling packaging gig description",
                "Generate a client delivery checklist for pouches",
                "Draft a professional reply regarding revision limits",
                "How do I optimize my designer portfolio bio?",
            ];
        }
        return [
            "How does the Unifiée packaging marketplace work?",
            "How can I submit a custom packaging requirement?",
            "What types of materials and suppliers are available?",
        ];
    }, [role]);

    const handleSend = async (textToSend?: string) => {
        const prompt = (textToSend ?? input).trim();
        if (!prompt || isLoading) return;

        setError(null);
        setInput("");

        msgCounterRef.current += 1;
        const userMsg: Message = {
            id: `user-${msgCounterRef.current}`,
            role: "user",
            content: prompt,
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setIsLoading(true);

        msgCounterRef.current += 1;
        const assistantMsgId = `assistant-${msgCounterRef.current}`;
        const placeholderAssistantMsg: Message = {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            sources: [],
        };

        setMessages((prev) => [...prev, placeholderAssistantMsg]);

        try {
            abortControllerRef.current = new AbortController();

            const res = await fetch("/api/ai/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                const isRateLimit = res.status === 429 || /rate limit|credit|quota/i.test(errData.error || "");
                const fallbackMsg = isRateLimit
                    ? "Our AI assistant is temporarily resting due to high demand. Please try again in a moment, or navigate directly to your workspace options."
                    : (errData.error || "The AI assistant is temporarily unavailable. Please try again shortly.");

                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === assistantMsgId
                            ? { ...msg, content: fallbackMsg }
                            : msg
                    )
                );
                return;
            }

            // Extract remaining daily budget
            const dailyHeader = res.headers.get("x-remaining-daily");
            if (dailyHeader) {
                setRemainingDaily(parseInt(dailyHeader, 10));
            }

            // Extract grounded sources
            const sourcesHeader = res.headers.get("x-grounded-sources");
            let extractedSources: GroundedSource[] = [];
            if (sourcesHeader) {
                try {
                    extractedSources = JSON.parse(decodeURIComponent(sourcesHeader));
                } catch (e) {
                    console.warn("Failed to parse grounded sources header", e);
                }
            }

            if (!res.body) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === assistantMsgId
                            ? { ...msg, content: "No response received. Please try again." }
                            : msg
                    )
                );
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === assistantMsgId
                            ? {
                                  ...msg,
                                  content: msg.content + chunk,
                                  sources: extractedSources,
                              }
                            : msg
                    )
                );
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name === "AbortError") {
                // User intentionally cancelled
                return;
            }
            console.error("AI chat error:", err);
            setError(err instanceof Error ? err.message : "Failed to generate AI response.");
            // Remove the empty assistant placeholder if failed completely
            setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId || m.content.length > 0));
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setMessages([]);
        setError(null);
    };

    const roleBadgeLabel =
        role === "business"
            ? "Business Assistant"
            : role === "manufacturer"
            ? "Vendor Ops Assistant"
            : role === "designer"
            ? "Designer Studio AI"
            : "Platform Assistant";

    return (
        <>
            {/* Floating Action Button (FAB) */}
            <div className="fixed inset-x-4 bottom-4 z-40 flex justify-end sm:inset-x-auto sm:right-5">
                {!isOpen && (
                    <Button
                        variant="default"
                        size="lg"
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="group relative h-10 rounded-full px-3.5 shadow-lg"
                        aria-label="Open AI Assistant"
                    >
                        <div className="relative">
                            <Sparkles className="size-5 transition-transform duration-300 group-hover:rotate-12" />
                        </div>
                        <span className="hidden sm:inline text-xs font-semibold tracking-wide pr-1">
                            AI Assistant
                        </span>
                    </Button>
                )}
            </div>

            {/* Chat Modal / Slide-over Window */}
            {isOpen && (
                <div className="fixed inset-x-0 bottom-0 z-50 flex h-[min(680px,calc(100dvh-1rem))] max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-xl animate-in fade-in-50 slide-in-from-bottom-6 duration-200 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[min(580px,85vh)] sm:max-h-[85vh] sm:w-[min(420px,calc(100vw-2.5rem))] sm:rounded-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <Sparkles className="size-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold tracking-tight text-foreground">
                                        UNIFIÉE AI
                                    </h3>
                                    <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                        {roleBadgeLabel}
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    {userName ? `Hi ${userName}, how can I help?` : "Ready to assist your workflow"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {messages.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    type="button"
                                    onClick={handleClear}
                                    className="text-muted-foreground hover:text-foreground"
                                    title="Clear conversation"
                                >
                                    <RotateCcw className="size-3.5" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="text-muted-foreground hover:text-foreground"
                                title="Close assistant"
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                        {messages.length === 0 ? (
                            <div className="flex min-h-full flex-col items-center justify-center space-y-4 px-2 py-4 text-center sm:px-4">
                                <div className="size-12 rounded-xl bg-muted flex items-center justify-center text-primary border border-border">
                                    <Bot className="size-6" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-sm text-foreground">
                                        Your Unifiée Copilot
                                    </h4>
                                    <p className="text-muted-foreground text-xs leading-relaxed max-w-[280px]">
                                        Ask questions about packaging specs, suppliers, orders, or let AI draft your requirements.
                                    </p>
                                </div>

                                {/* Suggested Prompts */}
                                <div className="w-full space-y-1.5 pt-2 text-left">
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Suggested questions
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        {quickPrompts.map((q, idx) => (
                                            <Button
                                                variant="outline"
                                                key={idx}
                                                type="button"
                                                onClick={() => handleSend(q)}
                                                className="h-auto min-h-9 w-full justify-between whitespace-normal p-2.5 text-left text-xs"
                                            >
                                                <span className="line-clamp-2">{q}</span>
                                                <Sparkles className="ml-2 size-3 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={`flex flex-col ${
                                        m.role === "user" ? "items-end" : "items-start"
                                    }`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                                            m.role === "user"
                                                ? "bg-primary text-primary-foreground rounded-tr-xs"
                                                : "bg-muted/80 text-foreground rounded-tl-xs border border-border/50"
                                        }`}
                                    >
                                        <div className="whitespace-pre-wrap">{m.content}</div>

                                        {/* Streaming cursor pulse if empty */}
                                        {m.role === "assistant" && !m.content && (
                                            <div className="flex items-center gap-1.5 py-1 text-muted-foreground">
                                                <Loader2 className="size-3 animate-spin text-primary" />
                                                <span className="text-[11px]">Thinking & retrieving docs...</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Grounded Source Citations */}
                                    {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                                        <div className="mt-2 pl-1 space-y-1 w-full">
                                            <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-1">
                                                <HelpCircle className="size-2.5" />
                                                <span>Sources Cited</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {m.sources.map((src) => (
                                                    <AiSourceChip
                                                        key={src.id}
                                                        title={src.title}
                                                        url={src.url}
                                                        similarityScore={src.similarityScore}
                                                        snippet={src.snippet}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}

                        {error && (
                            <AiErrorState
                                message={error}
                                onRetry={() => handleSend(messages[messages.length - 1]?.content)}
                                onDismiss={() => setError(null)}
                            />
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer / Input */}
                    <div className="border-t border-border/60 bg-background/50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            className="flex items-end gap-2"
                        >
                            <div className="relative flex-1">
                                <Textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Ask anything about packaging, suppliers, or orders..."
                                    rows={1}
                                    className="min-h-9 max-h-24 resize-none bg-card/60 text-xs"
                                />
                            </div>

                            {isLoading ? (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    type="button"
                                    onClick={handleStop}
                                    className="shrink-0"
                                    title="Stop generating"
                                >
                                    <div className="size-2.5 bg-destructive rounded-xs" />
                                </Button>
                            ) : (
                                <Button
                                    size="icon"
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="shrink-0"
                                    title="Send message (Enter)"
                                >
                                    <Send className="size-3.5" />
                                </Button>
                            )}
                        </form>

                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 pt-2 text-[10px] text-muted-foreground/80">
                            <span>Enter to send · Shift+Enter for new line</span>
                            {remainingDaily !== null && (
                                <span className="font-medium text-primary">
                                    {remainingDaily} free requests left today
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
