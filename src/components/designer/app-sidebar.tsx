"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarHeader,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
} from "@/components/ui/sidebar"
import { BriefcaseBusiness, CircleDollarSign, LayoutDashboard, LogOut, Loader2, UserRound, ClipboardList } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { useState } from "react"
import { toast } from "sonner"

const navRoutes = [
    { title: "Overview", url: "/designer", icon: LayoutDashboard },
    { title: "My services", url: "/designer/services", icon: BriefcaseBusiness },
    { title: "Client orders", url: "/designer/orders", icon: ClipboardList },
    { title: "Earnings", url: "/designer/earnings", icon: CircleDollarSign },
]

export default function DesignerAppSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [signingOut, setSigningOut] = useState(false)

    const handleSignOut = async () => {
        setSigningOut(true)
        await authClient.signOut()
        toast.success("Signed out")
        router.push("/")
        router.refresh()
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="h-16 justify-center border-b border-sidebar-border px-4 pt-4 pb-2 group-data-[collapsible=icon]:h-14 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-0">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent hover:text-foreground">
                            <Link href="/designer">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
                                    u.
                                </div>
                                <div className="flex flex-col leading-tight gap-0.5">
                                    <span className="text-sm font-bold tracking-tight">unifiée</span>
                                    <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Studio</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="pt-2 group-data-[collapsible=icon]:pt-1">
                <SidebarGroup className="px-3 py-2 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-1">
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1.5">
                            {navRoutes.map((route) => {
                                const isActive = route.url === "/designer"
                                    ? pathname === route.url
                                    : pathname.startsWith(route.url)

                                return (
                                <SidebarMenuItem key={route.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        tooltip={route.title}
                                        className="h-10 font-medium transition-all"
                                    >
                                        <Link href={route.url}>
                                            <route.icon className="size-4" />
                                            <span>{route.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="px-3 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith("/designer/profile")}
                            tooltip="My profile"
                        >
                            <Link href="/designer/profile">
                                <UserRound />
                                <span>My profile</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Sign Out"
                            onClick={handleSignOut}
                            disabled={signingOut}
                        >
                            {signingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
                            <span>Sign Out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
