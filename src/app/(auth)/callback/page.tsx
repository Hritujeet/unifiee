"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"
import { checkHasPasswordAction } from "@/actions/check-pw"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await authClient.getSession()
        
        if (error || !data) {
          window.location.href = "/sign-in"
          return
        }
        
        const hasPw = await checkHasPasswordAction()
        if (!hasPw) {
          window.location.href = "/set-password"
          return
        }
        
        const userCreatedAt = new Date(data.user.createdAt).getTime()
        const now = Date.now()
        
        // If the account was created less than 1 minute ago, consider it new
        if (now - userCreatedAt < 60000) {
          window.location.href = "/onboarding"
        } else {
          window.location.href = "/"
        }
      } catch (err) {
        console.error("Error checking session:", err)
        window.location.href = "/sign-in"
      }
    }
    
    checkUser()
  }, [router])

  return (
    <div className="flex w-full flex-col items-center justify-center min-h-[50vh] gap-4">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground animate-pulse">Completing sign in...</p>
    </div>
  )
}
