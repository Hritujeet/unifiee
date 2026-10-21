"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { setPasswordSchema } from "@/lib/zod-schema"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { setPasswordAction } from "@/actions/set-pw"

import { showValidationToast } from "@/lib/form-toast-utils"
import type { FieldErrors } from "react-hook-form"

export default function SetPasswordForm() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const [isRedirecting, setIsRedirecting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof setPasswordSchema>>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof setPasswordSchema>) => {
      toast.loading("Setting your password...", { id: "set-password" })
      const result = await setPasswordAction(data)
      if (!result?.success) {
        throw new Error(result?.error || "Failed to set password")
      }
      return result
    },
    onSuccess: () => {
      toast.success("Password set successfully!", {
        id: "set-password",
        description: "Your credentials are updated. Redirecting to your dashboard...",
        duration: 4000,
      })
      setIsRedirecting(true)
      // Let the server callback page decide where to send the user
      // (new user → /onboarding, or an existing role's dashboard)
      window.location.href = "/callback"
    },
    onError: (error) => {
      toast.error("Could not set password", {
        id: "set-password",
        description: error instanceof Error ? error.message : "An error occurred while updating your password.",
        duration: 6000,
      })
    }
  })

  const onSubmit = (data: z.infer<typeof setPasswordSchema>) => {
    mutation.mutate(data)
  }

  const onError = (formErrors: FieldErrors<z.infer<typeof setPasswordSchema>>) => {
    showValidationToast(formErrors, "Set Password")
  }

  const busy = mutation.isPending || isRedirecting

  return (
    <div className="w-full max-w-sm">
      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="flex flex-col px-0 py-0">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Set Password
          </h1>
          <ul className="mt-3 mb-8 space-y-1 text-sm text-muted-foreground">
            <li>Password must be at least 8 characters long</li>
            <li>You will use this password to sign in with email as well as Google</li>
            <li>A mix of letters, numbers, and symbols is recommended</li>
          </ul>

          <form onSubmit={handleSubmit(onSubmit, onError)} className="flex w-full flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-xs text-muted-foreground">
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                className="h-10 rounded-lg text-sm"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-[11px] font-medium text-destructive animate-in fade-in slide-in-from-top-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                className="h-10 rounded-lg text-sm"
                aria-invalid={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-[11px] font-medium text-destructive animate-in fade-in slide-in-from-top-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button disabled={busy} type="submit" className="mt-2 transition-all active:scale-[0.98]">
              {busy ? <Loader2 className="animate-spin size-4" /> : "Set Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
