"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Building2,
    User,
    Phone,
    Mail,
    MapPin,
    ShieldCheck,
    CheckCircle2,
    FileText,
} from "lucide-react"

export interface VendorProfileProps {
    profile: {
        id: string
        name: string
        fullName: string
        companyName: string
        email: string
        phone: string
        gstin: string | null
        manufacturerAddress: string | null
        packagingCategories: string[] | null
        capabilities: string[] | null
    }
}

export function FacilityProfileView({ profile }: VendorProfileProps) {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Manufacturer Profile & Verification
                    </h1>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Your verified business credentials, contact identity, and supply categories on UNIFIÉE.
                    </p>
                </div>
                <Badge
                    variant="outline"
                    className="self-start sm:self-auto bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-semibold gap-1.5 py-1 px-3 text-xs"
                >
                    <ShieldCheck className="size-3.5" />
                    Verified Partner
                </Badge>
            </div>

            {/* Profile Overview Card */}
            <Card className="border shadow-xs bg-card overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 via-background to-primary/5 p-6 border-b flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-primary-foreground font-black text-xl flex items-center justify-center shadow-sm">
                        {profile.companyName ? profile.companyName.charAt(0).toUpperCase() : "M"}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            {profile.companyName}
                        </h2>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span>Contact: {profile.fullName || profile.name}</span>
                            <span>&bull;</span>
                            <span className="font-mono">{profile.email}</span>
                        </p>
                    </div>
                </div>

                <CardContent className="p-6 space-y-5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <span className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
                                Legal Entity Name
                            </span>
                            <span className="font-bold text-foreground text-sm block">
                                {profile.companyName}
                            </span>
                        </div>

                        <div className="space-y-1">
                            <span className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
                                GSTIN Registration
                            </span>
                            <span className="font-mono font-bold text-foreground text-sm block">
                                {profile.gstin || "Verified on file"}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t pt-4">
                        <div className="space-y-1">
                            <span className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                <User className="size-3 text-primary" />
                                Primary Contact Person
                            </span>
                            <span className="font-semibold text-foreground text-sm block">
                                {profile.fullName || profile.name}
                            </span>
                        </div>

                        <div className="space-y-1">
                            <span className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                <Phone className="size-3 text-primary" />
                                Registered Phone
                            </span>
                            <span className="font-semibold text-foreground text-sm block">
                                {profile.phone}
                            </span>
                        </div>
                    </div>

                    <div className="border-t pt-4 space-y-1">
                        <span className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="size-3 text-primary" />
                            Facility / Factory Dispatch Address
                        </span>
                        <span className="font-medium text-foreground text-sm block leading-relaxed">
                            {profile.manufacturerAddress || "Address verified during vendor onboarding"}
                        </span>
                    </div>

                    {profile.packagingCategories && profile.packagingCategories.length > 0 && (
                        <div className="border-t pt-4 space-y-2">
                            <span className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider block">
                                Core Manufacturing Categories
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {profile.packagingCategories.map((cat, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs font-semibold py-1 px-2.5">
                                        {cat}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
