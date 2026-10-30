import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

export interface HiredServiceEmailParams {
    to: string
    recipientName: string
    orderNumber: string
    serviceTitle: string
    subject: string
    headline: string
    body: string
    actionUrl?: string
    actionLabel?: string
}

/**
 * Fire-and-forget email sender for hired service lifecycle events.
 */
export function sendHiredServiceEmail(params: HiredServiceEmailParams): void {
    if (!resend || !params.to) {
        console.log(`[EMAIL NOTIFICATION] (Simulated to ${params.to}): ${params.subject} - ${params.headline}`)
        return
    }

    const fromAddress = process.env.EMAIL_FROM || "UNIFIÉE Notifications <notifications@unifiee.com>"

    resend.emails
        .send({
            from: fromAddress,
            to: params.to,
            subject: params.subject,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px;">
                    <div style="background-color: #ffffff; padding: 32px; border-radius: 10px; border: 1px solid #e2e8f0;">
                        <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">${params.headline}</h2>
                        <p style="font-size: 14px; line-height: 1.6; color: #475569;">Hi ${params.recipientName},</p>
                        <p style="font-size: 14px; line-height: 1.6; color: #475569;">${params.body}</p>
                        <div style="margin: 20px 0; padding: 16px; background-color: #f1f5f9; border-radius: 8px;">
                            <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Project</div>
                            <div style="font-size: 14px; font-weight: 600; color: #0f172a;">${params.serviceTitle}</div>
                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Order ID: ${params.orderNumber}</div>
                        </div>
                        ${
                            params.actionUrl
                                ? `<div style="margin-top: 28px;">
                                    <a href="${params.actionUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
                                        ${params.actionLabel || "View Order Workspace"}
                                    </a>
                                   </div>`
                                : ""
                        }
                        <hr style="margin-top: 32px; border: none; border-top: 1px solid #e2e8f0;" />
                        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">UNIFIÉE Packaging Design Workspace · Payment is arranged directly between businesses and designers.</p>
                    </div>
                </div>
            `,
        })
        .then((res) => {
            if (res.error) {
                console.warn("[RESEND_ERROR]", res.error)
            }
        })
        .catch((err) => {
            console.error("[RESEND_FAILED]", err)
        })
}

