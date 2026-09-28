import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/site/login-form";

export default async function Page() {
    // Already signed in? Send straight to callback which handles role-based routing
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user) {
        redirect("/callback");
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <LoginForm />
        </div>
    );
}
