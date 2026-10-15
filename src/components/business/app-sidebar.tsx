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
} from '@/components/ui/sidebar'
import {
    Briefcase,
    Building2,
    FileText,
    LayoutDashboard,
    LogOut,
    Package,
    Palette,
    Tag,
    UserCircle,
    Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useState } from 'react'
import { toast } from 'sonner'

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

    const isDashboardActive = pathname === "/business"

    const procureRoutes = [
        { title: "Requirements", url: "/business/requirements", icon: FileText },
        { title: "Offers", url: "/business/offers", icon: Tag },
        { title: "Orders", url: "/business/orders", icon: Package },
    ]

    const exploreRoutes = [
        { title: "Explore vendors", url: "/business/explore", icon: Building2 },
        { title: "Explore designers", url: "/business/explore", icon: Palette },
        { title: "Hired services", url: "/business/explore", icon: Briefcase },
    ]

    return (
        <Sidebar collapsible="icon" className="border-r border-border/40 bg-sidebar">
            {/* Brand */}
            <SidebarHeader className="h-16 justify-center px-4 pt-3 pb-2 group-data-[collapsible=icon]:h-14 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-0">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent hover:text-foreground">
                            <Link href="/business" className="flex items-center gap-2.5">
                                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-sm shadow-sm">
                                    U
                                </div>
                                <div className="flex flex-col leading-tight gap-0.5">
                                    <span className="text-sm font-semibold tracking-tight text-foreground">Unifiée</span>
                                    <span className="text-[11px] text-muted-foreground font-normal">Business</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Main nav */}
            <SidebarContent className="px-2 pt-1 group-data-[collapsible=icon]:px-1">
                {/* Dashboard top link */}
                <SidebarGroup className="py-1">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isDashboardActive}
                                tooltip="Dashboard"
                                className="font-medium text-sm transition-all data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:font-semibold data-[active=true]:shadow-sm hover:data-[active=true]:bg-blue-600"
                            >
                                <Link href="/business">
                                    <LayoutDashboard className="size-4" />
                                    <span>Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Procure Group */}
                <SidebarGroup className="py-2">
                    <SidebarGroupLabel className="px-3 text-[11px] font-medium text-muted-foreground/80 tracking-normal group-data-[collapsible=icon]:hidden">
                        Procure
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1 mt-0.5">
                            {procureRoutes.map((route) => {
                                const isActive = pathname.startsWith(route.url)
                                return (
                                    <SidebarMenuItem key={route.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={route.title}
                                            className="font-normal text-sm text-muted-foreground hover:text-foreground transition-all data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:font-medium"
                                        >
                                            <Link href={route.url} className="flex items-center gap-2">
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

                {/* Explore Group */}
                <SidebarGroup className="py-2">
                    <SidebarGroupLabel className="px-3 text-[11px] font-medium text-muted-foreground/80 tracking-normal group-data-[collapsible=icon]:hidden">
                        Explore
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1 mt-0.5">
                            {exploreRoutes.map((route) => {
                                const isActive = pathname.startsWith(route.url)
                                return (
                                    <SidebarMenuItem key={route.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={route.title}
                                            className="font-normal text-sm text-muted-foreground hover:text-foreground transition-all data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:font-medium"
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
            <SidebarFooter className="px-2 py-3 group-data-[collapsible=icon]:px-1">
                <SidebarMenu className="gap-1">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith("/business/your-profile")}
                            tooltip="Your Profile"
                            className="text-muted-foreground hover:text-foreground transition-all data-[active=true]:bg-blue-600 data-[active=true]:text-white"
                        >
                            <Link href="/business/your-profile">
                                <UserCircle className="size-4" />
                                <span>Your profile</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Sign Out"
                            onClick={handleSignOut}
                            disabled={signingOut}
                            className="text-muted-foreground hover:text-foreground transition-all"
                        >
                            {signingOut
                                ? <Loader2 className="animate-spin size-4" />
                                : <LogOut className="size-4" />
                            }
                            <span>Sign out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}