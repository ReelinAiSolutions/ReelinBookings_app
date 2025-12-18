import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log("API Route Hit: /api/send-email (Gmail Mode)");

    // Check for App Password
    if (!process.env.GMAIL_APP_PASSWORD) {
        console.error("CRITICAL: GMAIL_APP_PASSWORD is missing.");
        return NextResponse.json({ error: "Server Misconfiguration: GMAIL_APP_PASSWORD missing." }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { to, subject, html, ownerEmail } = body;

        if (!to || !subject || !html) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create Transporter (Gmail)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'info@reelin.ca', // Your Gmail
                pass: process.env.GMAIL_APP_PASSWORD // Your 16-char App Password
            }
        });

        console.log("Attempting to send email via Gmail to:", to);

        // Send Email
        const info = await transporter.sendMail({
            from: '"Reelin Bookings" <info@reelin.ca>', // Platform Email
            to: to, // Customer
            bcc: ownerEmail || 'info@reelin.ca', // Business Owner
            replyTo: ownerEmail || 'info@reelin.ca', // Replies go to Business Owner
            subject: subject,
            html: html,
        });

        console.log("Email sent successfully:", info.messageId);
        return NextResponse.json({ success: true, messageId: info.messageId });

    } catch (error: any) {
        console.error("Gmail Send Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
