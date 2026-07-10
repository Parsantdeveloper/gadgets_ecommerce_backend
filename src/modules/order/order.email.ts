
import resend from '../../config/email.js';

type SendOrderProcessingEmailInput = {
        to: string;
        orderId: string;
        customerName?: string | null;
        totalAmount?: string;
        paymentMethod?: string;
};

const escapeHtml = (value: string) =>
        value
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\"/g, "&quot;")
                .replace(/'/g, "&#39;");

const buildOrderProcessingEmailHtml = ({
        customerName,
        orderId,
        totalAmount,
        paymentMethod,
}: Omit<SendOrderProcessingEmailInput, "to">) => {
        const safeName = escapeHtml((customerName && customerName.trim()) || "Customer");
        const safeOrderId = escapeHtml(orderId);
        const safeAmount = escapeHtml(totalAmount ?? "To be confirmed");
        const safePaymentMethod = escapeHtml(paymentMethod ?? "N/A");

        return `
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Your order is being processed</title>
    </head>
    <body style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6fb;padding:24px 12px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
                        <tr>
                            <td style="padding:24px 28px;background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);">
                                <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#bfdbfe;">Order Update</p>
                                <h1 style="margin:0;font-size:26px;line-height:1.25;color:#ffffff;">We are processing your order</h1>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:28px;">
                                <p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;">Hi <strong>${safeName}</strong>,</p>
                                <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#334155;">
                                    Great news. Your order is now in the processing queue. We are preparing it and will share the next update once it moves to shipping.
                                </p>

                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;margin:18px 0;">
                                    <tr>
                                        <td style="padding:16px 18px;">
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td style="font-size:13px;color:#64748b;padding:0 0 8px 0;">Order ID</td>
                                                    <td align="right" style="font-size:13px;color:#0f172a;font-weight:600;padding:0 0 8px 0;">${safeOrderId}</td>
                                                </tr>
                                                <tr>
                                                    <td style="font-size:13px;color:#64748b;padding:0 0 8px 0;">Total Amount</td>
                                                    <td align="right" style="font-size:13px;color:#0f172a;font-weight:600;padding:0 0 8px 0;">${safeAmount}</td>
                                                </tr>
                                                <tr>
                                                    <td style="font-size:13px;color:#64748b;">Payment Method</td>
                                                    <td align="right" style="font-size:13px;color:#0f172a;font-weight:600;">${safePaymentMethod}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin:0 0 20px 0;font-size:14px;line-height:1.7;color:#475569;">
                                    If you have questions about this order, simply reply to this email and our team will help you.
                                </p>

                                <p style="margin:0;font-size:14px;line-height:1.7;color:#0f172a;">
                                    Thank you,<br />
                                    <strong>Glorious Store Team</strong>
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:14px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center;">
                                This is an automated order status update for ${safeOrderId}.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>`;
};

export const sendOrderProcessingEmail = async ({
        to,
        orderId,
        customerName,
        totalAmount,
        paymentMethod,
}: SendOrderProcessingEmailInput) => {

    try {
                await resend.emails.send({
                        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
            to,
            subject: `Order Processing - ${orderId}`,
                        html: buildOrderProcessingEmailHtml({
                                orderId,
                                customerName,
                                totalAmount,
                                paymentMethod,
                        }),
                });
    } catch (error) {
        console.error('Error sending order processing email:', error);
    }
};