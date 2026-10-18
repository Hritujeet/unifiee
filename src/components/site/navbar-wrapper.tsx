import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserRole, type UserRole } from "@/actions/get-user-role";
import { NavbarClient } from "./navbar";

/**
 * Server component that pre-fetches session + role in parallel,
 * then passes them as props to the client Navbar.
 * This eliminates the client-side waterfall:
 *   Before: page loads → useSession() network call → getUserRole() server action → render buttons
 *   After:  server pre-fetches both → buttons render instantly on hydration
 */
export async function Navbar() {
    const session = await auth.api.getSession({ headers: await headers() });

    let role: UserRole | null = null;
    if (session?.user) {
        role = await getUserRole();
    }

    return (
        <NavbarClient
            initialSession={
                session?.user
                    ? {
                        user: {
                            id: session.user.id,
                            name: session.user.name,
                            email: session.user.email,
                            image: session.user.image ?? null,
                        },
                    }
                    : null
            }
            initialRole={role}
        />
    );
}
