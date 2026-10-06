"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react"

export type Theme = "light" | "dark" | "system"

type ThemeContextValue = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = "theme"
const listeners = new Set<() => void>()

function getTheme(): Theme {
    if (typeof window === "undefined") return "system"

    try {
        const theme = window.localStorage.getItem(STORAGE_KEY)
        return theme === "light" || theme === "dark" ? theme : "system"
    } catch {
        return "system"
    }
}

function applyTheme(theme: Theme) {
    const dark = theme === "dark" || (
        theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches
    )
    document.documentElement.classList.toggle("dark", dark)
    document.documentElement.style.colorScheme = dark ? "dark" : "light"
}

function subscribe(listener: () => void) {
    listeners.add(listener)
    const handleStorage = () => {
        applyTheme(getTheme())
        listeners.forEach((notify) => notify())
    }
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemThemeChange = () => {
        if (getTheme() === "system") applyTheme("system")
    }

    window.addEventListener("storage", handleStorage)
    mediaQuery.addEventListener("change", handleSystemThemeChange)
    return () => {
        listeners.delete(listener)
        window.removeEventListener("storage", handleStorage)
        mediaQuery.removeEventListener("change", handleSystemThemeChange)
    }
}

function setStoredTheme(theme: Theme) {
    try {
        window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
        // Keep the current page theme usable when browser storage is unavailable.
    }
    applyTheme(theme)
    listeners.forEach((listener) => listener())
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useSyncExternalStore<Theme>(subscribe, getTheme, () => "system")
    const setTheme = useCallback((nextTheme: Theme) => setStoredTheme(nextTheme), [])

    useEffect(() => {
        applyTheme(theme)
    }, [theme])

    const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) throw new Error("useTheme must be used within ThemeProvider.")
    return context
}
