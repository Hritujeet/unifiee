"use client"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import OnboardingForm from "@/components/site/onboarding-form"

const OnboardingPage = () => {
    const router = useRouter()
    const { data: session, isPending } = authClient.useSession()

    useEffect(() => {
        if (!isPending && !session) {
            router.replace("/sign-in")
        }
    }, [session, isPending, router])

    if (isPending || !session) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return <OnboardingForm />
}

export default OnboardingPage