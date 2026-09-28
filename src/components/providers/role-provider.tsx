"use client";

import { useEffect } from "react";
import { getUserRole } from "@/actions/get-user-role";
import { useUserRoleStore } from "@/lib/stores/user-role-store";

/**
 * Hydrates the client-side Zustand role store from the server action.
 * Rendered once near the root of authenticated layouts.
 */
export default function RoleProvider({ children }: { children: React.ReactNode }) {
    const setRole = useUserRoleStore((s) => s.setRole);

    useEffect(() => {
        getUserRole().then(setRole);
    }, [setRole]);

    return <>{children}</>;
}
