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
    { title: "Dashboard", url: "/vendor", icon: LayoutDashboard },
    { title: "Orders", url: "/vendor/order-dashboard", icon: ShoppingCart },
    { title: "Submit Quotation", url: "/vendor/submit-quotation", icon: FileText },
]

export default function VendorAppSidebar() {
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
            <SidebarHeader className="h-14 justify-center px-3 lg:h-16">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/vendor">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground text-background text-xs font-bold">
                                    V
                                </div>
                                <div className="flex flex-col leading-tight">
                                    <span className="text-sm font-semibold">Unifiée</span>
                                    <span className="text-xs text-muted-foreground">Vendor</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarSeparator />

            {/* Main nav */}
            <SidebarContent className="pt-1">
                <SidebarGroup className="px-2 py-2">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navRoutes.map((route) => {
                                const isActive =
                                    route.url === "/vendor"
                                        ? pathname === "/vendor"
                                        : pathname.startsWith(route.url)
                                return (
                                    <SidebarMenuItem key={route.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={route.title}
                                        >
                                            <Link href={route.url}>
                                                <route.icon />
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
            <SidebarFooter className="px-2 py-2">
                <SidebarSeparator className="mb-2" />
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith("/vendor/your-profile")}
                            tooltip="Your Profile"
                        >
                            <Link href="/vendor/your-profile">
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