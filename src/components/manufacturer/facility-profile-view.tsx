"use client"

import { useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Building2, User, Phone, Mail, MapPin } from "lucide-react"

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
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="border-b pb-4">
                <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Vendor Profile
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                    Your verified business identity and company information on UNIFIÉE.
                </p>
            </div>

            <Card className="border shadow-xs">
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Building2 className="size-4 text-primary" />
                        Company Details
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Registered business credentials visible to buyers
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <span className="text-muted-foreground block text-[11px]">Company Name</span>
                            <span className="font-semibold text-foreground text-sm">{profile.companyName}</span>
                        </div>

                        <div>
                            <span className="text-muted-foreground block text-[11px]">GSTIN Number</span>
                            <span className="font-mono font-medium text-foreground text-sm">
                                {profile.gstin || "Not provided"}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-3">
                        <div>
                            <span className="text-muted-foreground block text-[11px]">Contact Person</span>
                            <span className="font-medium text-foreground">{profile.fullName || profile.name}</span>
                        </div>

                        <div>
                            <span className="text-muted-foreground block text-[11px]">Contact Phone</span>
                            <span className="font-medium text-foreground">{profile.phone}</span>
                        </div>
                    </div>

                    <div className="border-t pt-3">
                        <span className="text-muted-foreground block text-[11px]">Official Email</span>
                        <span className="font-medium text-foreground">{profile.email}</span>
                    </div>

                    <div className="border-t pt-3">
                        <span className="text-muted-foreground block text-[11px]">Factory / Office Address</span>
                        <span className="font-medium text-foreground">
                            {profile.manufacturerAddress || "Address not provided"}
                        </span>
                    </div>

                    {profile.packagingCategories && profile.packagingCategories.length > 0 && (
                        <div className="border-t pt-3">
                            <span className="text-muted-foreground block text-[11px] mb-1.5">Packaging Categories</span>
                            <div className="flex flex-wrap gap-1.5">
                                {profile.packagingCategories.map((cat, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[11px]">
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
