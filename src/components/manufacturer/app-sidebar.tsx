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
    SidebarGroupLabel,
} from "@/components/ui/sidebar"
import {
    LayoutDashboard,
    ShoppingCart,
    PlusCircle,
    ClipboardList,
    FileSpreadsheet,
    User,
    LogOut,
    Loader2,
    Building,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { useState } from "react"
import { toast } from "sonner"

const navItems = [
    { title: "Dashboard", url: "/manufacturer", icon: LayoutDashboard },
    { title: "Orders", url: "/manufacturer/order-dashboard", icon: ShoppingCart },
    { title: "My Offerings", url: "/manufacturer/offerings", icon: ClipboardList },
    { title: "Post Offering", url: "/manufacturer/publish-offering", icon: PlusCircle },
    { title: "Quotations", url: "/manufacturer/quotations", icon: FileSpreadsheet },
]

export default function ManufacturerAppSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [signingOut, setSigningOut] = useState(false)

    const handleSignOut = async () => {
        setSigningOut(true)
        await authClient.signOut()
        toast.success("Signed out successfully")
        router.push("/")
        router.refresh()
    }

    return (
        <Sidebar collapsible="icon" className="border-r border-border/80 bg-sidebar">
            {/* Header / Brand */}
            <SidebarHeader className="h-16 justify-center px-4 border-b border-sidebar-border/60">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
                            <Link href="/manufacturer" className="flex items-center gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-xs">
                                    U
                                </div>
                                <div className="flex flex-col leading-none gap-1">
                                    <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
                                        Unifiée
                                    </span>
                                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                        Vendor Portal
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Navigation Group */}
            <SidebarContent className="px-2 py-3">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                        Operations
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1">
                            {navItems.map((item) => {
                                const isActive =
                                    item.url === "/manufacturer"
                                        ? pathname === "/manufacturer"
                                        : pathname.startsWith(item.url)
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.title}
                                            className={`h-9 px-3 rounded-md font-medium text-xs transition-colors ${
                                                isActive
                                                    ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                            }`}
                                        >
                                            <Link href={item.url} className="flex items-center gap-2.5">
                                                <item.icon className="size-4 shrink-0" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer: User Account & Sign Out */}
            <SidebarFooter className="p-3 border-t border-sidebar-border/60">
                <SidebarMenu className="gap-1">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith("/manufacturer/your-profile")}
                            tooltip="Profile & Account"
                            className="h-9 px-3 text-xs"
                        >
                            <Link href="/manufacturer/your-profile" className="flex items-center gap-2.5">
                                <User className="size-4 text-muted-foreground" />
                                <span>Account Profile</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleSignOut}
                            disabled={signingOut}
                            tooltip="Sign Out"
                            className="h-9 px-3 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                            {signingOut ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <LogOut className="size-4" />
                            )}
                            <span>Sign Out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}