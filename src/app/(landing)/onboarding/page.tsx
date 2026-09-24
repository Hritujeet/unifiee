"use client"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import OnboardingForm from "@/components/site/onboarding-form"

const OnboardingPage = () => {
    const router = useRouter()
    const { data: session, isPending } = authClient.useSession()

    useEffect(() => {
        if (!isPending && !session) {
            router.replace("/sign-in")
        }
    }, [session, isPending, router])

    if (isPending) return null

    if (!session) return null

    return <OnboardingForm />
}

export default OnboardingPage