"use client"
import { cn } from "cn"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { loginFormSchema } from "@/lib/zod-schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { authClient } from "@/lib/auth-client"
import { useState } from "react"

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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })
  const queryClient = useQueryClient()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const mutation = useMutation({
    mutationFn: async (formData: z.infer<typeof loginFormSchema>) => {
      return await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
      })
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message || "Invalid email or password.")
        setValue("password", "", { shouldValidate: false })
        setValue("email", "", { shouldValidate: false })
        return
      }
      toast.success("Signed in successfully!")
      queryClient.invalidateQueries({ queryKey: ["account", "user"] })
      setIsRedirecting(true)
      router.push("/")
    },
    onError: () => {
      toast.error("Something went wrong. Please check your connection and try again.")
    },
  })

  const submitHandler = (data: z.infer<typeof loginFormSchema>) => {
    mutation.mutate(data)
  }

  const busy = mutation.isPending || isSubmitting || isRedirecting

  return (
    <div className={cn("w-full max-w-md", className)} {...props}>
      <Card className="overflow-hidden rounded-2xl ring-1 ring-border/60 shadow-xl shadow-black/5 dark:shadow-black/20">
        <CardContent className="flex flex-col items-center px-8 py-4">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to your UNIFIÉE account
          </p>

          <form onSubmit={handleSubmit(submitHandler)} className="flex w-full flex-col gap-4" noValidate>
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
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs text-muted-foreground">
                  Password
                </Label>
                <Link
                  href="#"
                  className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="h-10 rounded-lg text-sm"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button disabled={busy} type="submit">
              {busy ? <Loader2 className="animate-spin" /> : "Sign In"}
            </Button>

            <div className="relative flex items-center gap-3 text-xs text-muted-foreground">
              <Separator className="flex-1" />
              <span className="font-mono uppercase tracking-widest shrink-0">or</span>
              <Separator className="flex-1" />
            </div>

            <Button disabled={busy} variant="outline" type="button" className="gap-2.5">
              <GoogleIcon />
              Continue with Google
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="font-medium text-foreground transition-colors underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}