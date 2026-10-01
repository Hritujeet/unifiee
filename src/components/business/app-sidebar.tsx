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
    SidebarSeparator,
} from '@/components/ui/sidebar'
import { LayoutDashboard, ShoppingCart, FileText, UserCircle, LogOut, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useState } from 'react'
import { toast } from 'sonner'

const navRoutes = [
    { title: "Dashboard", url: "/business", icon: LayoutDashboard },
    { title: "Orders", url: "/business/orders", icon: ShoppingCart },
    { title: "Quotations", url: "/business/quotations", icon: FileText },
]

export default function BusinessAppSidebar() {
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
            <SidebarHeader className="h-16 justify-center px-4 pt-4 pb-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pt-0 group-data-[collapsible=icon]:pb-0 group-data-[collapsible=icon]:h-14 group-data-[collapsible=icon]:justify-center">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent hover:text-foreground">
                            <Link href="/business">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-sm">
                                    B
                                </div>
                                <div className="flex flex-col leading-tight gap-0.5">
                                    <span className="text-sm font-bold tracking-tight">Unifiée</span>
                                    <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Business</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarSeparator />

            {/* Main nav */}
            <SidebarContent className="pt-2 group-data-[collapsible=icon]:pt-1">
                <SidebarGroup className="px-3 py-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-1">
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1.5">
                            {navRoutes.map((route) => {
                                const isActive =
                                    route.url === "/business"
                                        ? pathname === "/business"
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
            <SidebarFooter className="px-3 py-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2">
                <SidebarSeparator className="mb-4 group-data-[collapsible=icon]:hidden" />
                <SidebarMenu className="gap-1.5">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith("/business/your-profile")}
                            tooltip="Your Profile"
                        >
                            <Link href="/business/your-profile">
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
