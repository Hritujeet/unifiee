import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/site/signup-form";

export default async function Page() {
    // Already signed in? Redirect to callback for role-based routing
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user) {
        redirect("/callback");
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <SignupForm />
        </div>
    );
}
