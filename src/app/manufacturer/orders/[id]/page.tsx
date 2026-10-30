import { notFound } from "next/navigation"
import { getVendorOrderDetail } from "@/actions/vendor-actions"
import VendorOrderDetailView from "@/components/manufacturer/vendor-order-detail-view"

export default async function ManufacturerOrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const result = await getVendorOrderDetail(id)
    if (!result.success || !result.data) notFound()
    return <VendorOrderDetailView detail={result.data} />
}
