"use client"
import { cn } from "cn"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { signupFormSchema } from "@/lib/zod-schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { authClient } from "@/lib/auth-client"

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

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<z.infer<typeof signupFormSchema>>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: ""
    }
  })

  const mutation = useMutation({
    mutationFn: async (formData: z.infer<typeof signupFormSchema>) => {
      const { data: result, error } = await authClient.signUp.email({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })
      if (result) {
        return result
      }
      else {
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["account", "user"]
      })
      reset()
      toast.success("Account created successfully!")
      router.push("/onboarding")
    },
    onError: (error) => {
      console.error(error)
      toast.error("Failed to create account. Please try again.")
      reset()
    }
  })


  const submitHandler = async (data: z.infer<typeof signupFormSchema>) => {
    mutation.mutate(data);
  }

  return (
    <div className={cn("w-full max-w-md", className)} {...props}>
      <Card className="overflow-hidden rounded-2xl ring-1 ring-border/60 shadow-xl shadow-black/5 dark:shadow-black/20">
        <CardContent className="flex flex-col items-center px-8 py-4">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground mb-2">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Join UNIFIÉE - One place for all your packaging needs
          </p>

          <form onSubmit={handleSubmit(submitHandler)} className="flex w-full flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-xs text-muted-foreground">
                Name
              </Label>
              <Input id="name" type="text" placeholder="Alex" className="h-10 rounded-lg text-sm" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs text-muted-foreground">
                Email
              </Label>
              <Input id="email" type="email" placeholder="you@company.com" className="h-10 rounded-lg text-sm" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs text-muted-foreground">
                  Password
                </Label>
                <Link href="#" className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" type="password" className="h-10 rounded-lg text-sm" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? <Loader2 className="animate-spin" /> : "Create Account"}
            </Button>

            <div className="relative flex items-center gap-3 text-xs text-muted-foreground">
              <Separator className="flex-1" />
              <span className="font-mono uppercase tracking-widest shrink-0">or</span>
              <Separator className="flex-1" />
            </div>

            <Button disabled={mutation.isPending} variant="outline" type="button" className="gap-2.5">
              <GoogleIcon />
              Continue with Google
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-medium text-foreground transition-colors underline-offset-4 hover:underline">
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div >
  )
}
