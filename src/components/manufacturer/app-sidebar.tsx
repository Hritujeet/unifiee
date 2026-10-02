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
} from '@/components/ui/sidebar'
import { LayoutDashboard, ShoppingCart, FileText, UserCircle, LogOut, Loader2, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useState } from 'react'
import { toast } from 'sonner'

const navRoutes = [
    { title: "Dashboard", url: "/manufacturer", icon: LayoutDashboard },
    { title: "Orders", url: "/manufacturer/order-dashboard", icon: ShoppingCart },
    { title: "My Quotations", url: "/manufacturer/quotations", icon: ClipboardList },
    { title: "Submit Quotation", url: "/manufacturer/submit-quotation", icon: FileText },
]

export default function ManufacturerAppSidebar() {
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
            {/* Brand */}
            <SidebarHeader className="h-16 justify-center px-4 pt-4 pb-2 group-data-[collapsible=icon]:h-14 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-0">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent hover:text-foreground">
                            <Link href="/manufacturer">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-sm">
                                    M
                                </div>
                                <div className="flex flex-col leading-tight gap-0.5">
                                    <span className="text-sm font-bold tracking-tight">Unifiée</span>
                                    <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Manufacturer</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Main nav */}
            <SidebarContent className="pt-2 group-data-[collapsible=icon]:pt-1">
                <SidebarGroup className="px-3 py-2 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-1">
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1.5">
                            {navRoutes.map((route) => {
                                const isActive =
                                    route.url === "/manufacturer"
                                        ? pathname === "/manufacturer"
                                        : pathname.startsWith(route.url)
                                return (
                                    <SidebarMenuItem key={route.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={route.title}
                                            className="font-medium transition-all"
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

            {/* Footer: Profile + Sign out */}
            <SidebarFooter className="px-3 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
                <SidebarMenu className="gap-1.5">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith("/manufacturer/your-profile")}
                            tooltip="Your Profile"
                        >
                            <Link href="/manufacturer/your-profile">
                                <UserCircle />
                                <span>Your Profile</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Sign Out"
                            onClick={handleSignOut}
                            disabled={signingOut}
                        >
                            {signingOut
                                ? <Loader2 className="animate-spin" />
                                : <LogOut />
                            }
                            <span>Sign Out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}