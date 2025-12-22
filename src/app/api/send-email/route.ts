import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    console.log("API Route Hit: /api/send-email (Resend Mode)");

    if (!process.env.RESEND_API_KEY) {
        console.error("CRITICAL: RESEND_API_KEY is missing.");
        return NextResponse.json({ error: "Server Misconfiguration: RESEND_API_KEY missing." }, { status: 500 });
    }

    // SECURITY: Prevent external abuse of this endpoint
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host'); // e.g. localhost:3000 or my-app.com

    // We verify that the request is coming from our own domain (or localhost during dev)
    // Allow if origin includes host, or if it's a Vercel preview deployment
    const isAllowed =
        (origin && origin.includes(host || '')) ||
        (referer && referer.includes(host || '')) ||
        (process.env.NODE_ENV === 'development') ||
        (origin && origin.includes('vercel.app')); // Allow Vercel previews

    if (!isAllowed) {
        console.error(`Security Block: Blocked email request from ${origin || 'unknown'}`);
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }


    try {
        const body = await request.json();
        const { to, subject, html, ownerEmail } = body;

        if (!to || !subject || !html) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log("Attempting to send email via Resend to:", to);

        const data = await resend.emails.send({
            from: 'Reelin Bookings <onboarding@resend.dev>', // Default testing domain
            to: to,
            subject: subject,
            html: html,
            replyTo: ownerEmail || 'info@reelin.ca'
        });

        if (data.error) {
            console.error("Resend API Error:", data.error);
            return NextResponse.json({ error: data.error.message }, { status: 500 });
        }

        console.log("Email sent successfully:", data.data?.id);
        return NextResponse.json({ success: true, messageId: data.data?.id });

    } catch (error: any) {
        console.error("Resend Send Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
