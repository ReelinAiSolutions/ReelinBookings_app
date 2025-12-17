import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log("API Route Hit: /api/send-email");
    console.log("Env Key Check:", process.env.RESEND_API_KEY ? "Present" : "Missing");

    if (!process.env.RESEND_API_KEY) {
        console.error("CRITICAL: RESEND_API_KEY is missing from environment variables.");
        return NextResponse.json({ error: "Server Misconfiguration: RESEND_API_KEY is missing." }, { status: 500 });
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const body = await request.json();
        const { to, subject, html } = body;

        if (!to || !subject || !html) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log("Attempting to send email to:", to);
        const data = await resend.emails.send({
            from: 'Reelin Bookings <onboarding@resend.dev>', // MUST use this for testing
            to: [to],
            subject: subject,
            html: html,
            tags: [
                {
                    name: 'category',
                    value: 'confirm_email',
                },
            ],
        });

        if (data.error) {
            console.error("Resend API Error:", data.error);
            return NextResponse.json({ error: data.error }, { status: 500 });
        }

        console.log("Email sent successfully:", data);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Internal Email Error:", error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
