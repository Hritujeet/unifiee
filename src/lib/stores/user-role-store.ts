import { create } from "zustand";

export type UserRole = "manufacturer" | "designer" | "business" | "none" | null; // null = not yet loaded

interface UserRoleState {
    role: UserRole;
    setRole: (role: UserRole) => void;
}

export const useUserRoleStore = create<UserRoleState>((set) => ({
    role: null, // null means "not fetched yet"
    setRole: (role) => set({ role }),
}));
