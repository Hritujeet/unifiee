"use client"
import { cn } from "cn"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { authClient } from "@/lib/auth-client"
import { useState } from "react"
import { useRouter } from "next/navigation"

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="size-4"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

const basicInfoSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long").max(100, "Name is too long"),
  email: z.string().trim().email("Please provide a valid email address").max(255, "Email is too long"),
})

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long").max(128, "Password cannot exceed 128 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters long").max(128, "Password cannot exceed 128 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
})

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [step, setStep] = useState<"details" | "password">("details")
  const [showPassword, setShowPassword] = useState(false)
  
  const [pendingName, setPendingName] = useState("")
  const [pendingEmail, setPendingEmail] = useState("")

  const {
    register: registerBasic,
    handleSubmit: handleBasicSubmit,
    formState: { errors: basicErrors },
  } = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    setValue: setPasswordValue,
  } = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const mutation = useMutation({
    mutationFn: async (formData: z.infer<typeof passwordSchema>) => {
      return await authClient.signUp.email({
        name: pendingName.trim(),
        email: pendingEmail.trim(),
        password: formData.password,
      })
    },
    onSuccess: (result) => {
      if (result.error) {
        const isRateLimited = result.error.status === 429 ||
          /too many requests|rate limit/i.test(result.error.message || "");
        if (isRateLimited) {
          toast.error("Too many registration attempts", {
            description: "Please wait a minute before trying again.",
            duration: 6000,
          })
          return
        }
        toast.error("Account creation failed", {
          description: result.error.message || "Failed to create account. This email might already be in use.",
          duration: 6000,
        })
        setPasswordValue("password", "", { shouldValidate: false })
        setPasswordValue("confirmPassword", "", { shouldValidate: false })
        return
      }
      toast.success("Account created successfully!", {
        description: "Welcome to UNIFIÉE! Taking you to onboarding...",
        duration: 3000,
      })
      setIsRedirecting(true)
      router.push("/onboarding")
      router.refresh()
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : "Unable to reach server."
      const isRateLimited = /too many requests|rate limit/i.test(msg)
      toast.error(isRateLimited ? "Too many registration attempts" : "Registration failed", {
        description: isRateLimited ? "Please wait a minute before trying again." : msg,
        duration: 6000,
      })
    },
  })

  const googleMutation = useMutation({
    mutationFn: async () => {
      return await authClient.signIn.social({
        provider: "google",
        callbackURL: "/callback",
      })
    },
    onError: (error) => {
      toast.error("Google sign-up error", {
        description: error instanceof Error ? error.message : "Failed to connect to Google OAuth. Please try again.",
        duration: 6000,
      })
    },
  })

  const onBasicSubmit = (data: z.infer<typeof basicInfoSchema>) => {
    setPendingName(data.name)
    setPendingEmail(data.email)
    setPasswordValue("password", "", { shouldValidate: false })
    setPasswordValue("confirmPassword", "", { shouldValidate: false })
    setStep("password")
  }

  const onPasswordSubmit = (data: z.infer<typeof passwordSchema>) => {
    mutation.mutate(data)
  }

  const busy = isRedirecting || googleMutation.isPending

  return (
    <div className={cn("w-full max-w-sm", className)} {...props}>
      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="flex flex-col px-0 py-0">
          {step === "details" ? (
            <>
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                Create an account
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Join UNIFIÉE — one place for all your packaging needs
              </p>

              <form onSubmit={handleBasicSubmit(onBasicSubmit)} className="mt-8 flex w-full flex-col gap-4" noValidate>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name" className="text-xs text-muted-foreground">
                    Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Alex"
                    className="h-10 rounded-lg text-sm"
                    aria-invalid={!!basicErrors.name}
                    {...registerBasic("name")}
                  />
                  {basicErrors.name && (
                    <p className="text-[11px] font-medium text-destructive animate-in fade-in slide-in-from-top-1">{basicErrors.name.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-xs text-muted-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="h-10 rounded-lg text-sm"
                    aria-invalid={!!basicErrors.email}
                    {...registerBasic("email")}
                  />
                  {basicErrors.email && (
                    <p className="text-[11px] font-medium text-destructive animate-in fade-in slide-in-from-top-1">{basicErrors.email.message}</p>
                  )}
                </div>

                <Button disabled={busy} type="submit" className="transition-all active:scale-[0.98]">
                  Continue
                </Button>

                <div className="relative flex items-center gap-3 text-xs text-muted-foreground">
                  <Separator className="flex-1" />
                  <span className="font-mono uppercase tracking-widest shrink-0">or</span>
                  <Separator className="flex-1" />
                </div>

                <Button disabled={busy} variant="outline" type="button" className="gap-2.5 transition-all hover:bg-muted/50 active:scale-[0.98]" onClick={() => googleMutation.mutate()}>
                  {googleMutation.isPending ? <Loader2 className="animate-spin size-4" /> : <GoogleIcon />}
                  Continue with Google
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/sign-in" className="font-medium text-foreground transition-colors underline-offset-4 hover:underline">
                  Sign In
                </Link>
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep("details")
                  setShowPassword(false)
                }}
                className="mb-6 flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Back
              </button>

              <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                Secure your account
              </h1>
              <p className="mt-1.5 truncate text-sm text-muted-foreground">
                Creating account for {pendingEmail}
              </p>

              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="mt-8 flex flex-col gap-4" noValidate>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password" className="text-xs text-muted-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="h-10 rounded-lg text-sm pr-10"
                      aria-invalid={!!passwordErrors.password}
                      {...registerPassword("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {passwordErrors.password && (
                    <p className="text-[11px] font-medium text-destructive animate-in fade-in slide-in-from-top-1">{passwordErrors.password.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className="h-10 rounded-lg text-sm"
                    aria-invalid={!!passwordErrors.confirmPassword}
                    {...registerPassword("confirmPassword")}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-[11px] font-medium text-destructive animate-in fade-in slide-in-from-top-1">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>

                <Button disabled={mutation.isPending || isRedirecting} type="submit" className="transition-all active:scale-[0.98]">
                  {(mutation.isPending || isRedirecting) ? <Loader2 className="animate-spin" /> : "Register"}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}