import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function initWebPush() {
    let public_key = process.env.VAPID_PUBLIC_KEY;
    let private_key = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@reelin.ca';

    // FALLBACK: If process.env is stale, read from file directly
    if (!public_key || !private_key) {
        try {
            const envPath = path.resolve(process.cwd(), '.env.local');
            if (fs.existsSync(envPath)) {
                const content = fs.readFileSync(envPath, 'utf8');
                const lines = content.split(/\r?\n/);
                lines.forEach(line => {
                    const [key, ...val] = line.split('=');
                    if (key === 'VAPID_PUBLIC_KEY') public_key = val.join('=').trim();
                    if (key === 'VAPID_PRIVATE_KEY') private_key = val.join('=').trim();
                });
            }
        } catch (e) {
            console.error('Fallback env read failed:', e);
        }
    }

    if (public_key && private_key) {
        webpush.setVapidDetails(subject, public_key, private_key);
        return true;
    }
    return false;
}

export async function POST(req: Request) {
    try {
        const isConfigured = initWebPush();
        if (!isConfigured) {
            console.error('VAPID keys are missing');
            return NextResponse.json({ error: 'Server misconfigured (VAPID)' }, { status: 500 });
        }

        // Indestructible Fallback for Supabase
        let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.log('[PUSH API] Environment missing keys. Reading from filesystem...');
            try {
                const envPath = path.resolve(process.cwd(), '.env.local');
                if (fs.existsSync(envPath)) {
                    const content = fs.readFileSync(envPath, 'utf8');
                    const lines = content.split(/\r?\n/);
                    lines.forEach(line => {
                        const [key, ...val] = line.split('=');
                        if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val.join('=').trim();
                        if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = val.join('=').trim();
                    });
                }
            } catch (e) {
                console.error('[PUSH API] Filesystem env read failed:', e);
            }
        }

        // Final code-level hardcoded safety net
        if (!supabaseUrl || !supabaseServiceKey) {
            console.log('[PUSH API] CRITICAL: Using code-level hardcoded fallbacks');
            supabaseUrl = 'https://jqnrzctlxsxxxqogeidg.supabase.co';
            supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxbnJ6Y3RseHN4eHhxb2dlaWRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk1MTkwNSwiZXhwIjoyMDgxNTI3OTA1fQ.ZyAjVXoAYmH0CqfzKYlGPO7b0WCknE4WZme_k78PXo0';
        }

        const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const bodyPayload = await req.json();
        const { userId, title, body, url, notificationTag, type } = bodyPayload;

        console.log('>>> [PUSH API] REQUEST START <<<');
        console.log('Payload:', { userId, title, type });
        console.log('VAPID Status:', isConfigured ? 'READY' : 'MISSING');

        // Trace test only (for basic API verification)
        if (type === 'TRACE_TEST') {
            return NextResponse.json({ status: 'ok', message: 'Protocol verified', received: bodyPayload });
        }

        let targetUserIds = [userId];

        // 1. Resolve Recipient List
        // If the ID is a Staff Record, we resolve it to a User ID and ALSO find all Admins for that Org
        console.log(`[Push API] Resolving recipients for: ${userId}...`);

        const { data: staffRecord } = await supabase
            .from('staff')
            .select('user_id, org_id, name')
            .eq('id', userId)
            .single();

        if (staffRecord) {
            console.log(`[Push API] Staff member detected: ${staffRecord.name}`);
            const recipients = new Set<string>();

            // Add the Staff member themselves
            if (staffRecord.user_id) recipients.add(staffRecord.user_id);
            else recipients.add(userId); // Fallback to raw ID

            // Add all Admins for this Organization (The "Pro" management feature)
            const { data: admins } = await supabase
                .from('profiles')
                .select('id, receive_all_notifications')
                .eq('org_id', staffRecord.org_id)
                .eq('role', 'owner');

            if (admins) {
                admins.forEach(adm => {
                    // Only add if they haven't explicitly turned it off (default to true)
                    if (adm.receive_all_notifications !== false) {
                        recipients.add(adm.id);
                    }
                });
                console.log(`[Push API] Multi-broadcast set: ${recipients.size} active recipients.`);
            }

            targetUserIds = Array.from(recipients);
        }

        // 2. Get subscriptions for ALL target users
        const { data: subscriptions, error: subError } = await supabase
            .from('push_subscriptions')
            .select('*')
            .in('user_id', targetUserIds);

        if (subError) {
            console.error('Supabase sub error:', subError);
            return NextResponse.json({ error: subError.message }, { status: 500 });
        }

        if (!subscriptions || subscriptions.length === 0) {
            console.log('No subscriptions found for targeting set:', targetUserIds);
            return NextResponse.json({ message: 'No subscriptions found' }, { status: 200 });
        }

        // 2. Send push to each device
        const results = await Promise.allSettled(
            subscriptions.map(async (sub: any) => {
                try {
                    const pushSubscription = typeof sub.subscription === 'string'
                        ? JSON.parse(sub.subscription)
                        : sub.subscription;

                    await webpush.sendNotification(pushSubscription, JSON.stringify({
                        title,
                        body,
                        url: url || '/admin',
                        tag: notificationTag
                    }));
                    return { success: true, id: sub.id };
                } catch (err: any) {
                    console.error('WebPush error for sub', sub.id, err);

                    if (err.statusCode === 404 || err.statusCode === 410) {
                        console.log('Deleting expired subscription:', sub.id);
                        await supabase
                            .from('push_subscriptions')
                            .delete()
                            .eq('id', sub.id);
                    }
                    throw err;
                }
            })
        );

        return NextResponse.json({
            success: true,
            attempted: subscriptions.length,
            results: results.map((r: any) => r.status)
        });

    } catch (error: any) {
        console.error('Push API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
