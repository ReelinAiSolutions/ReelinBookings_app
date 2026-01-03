import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function initWebPush() {
    const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
    const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@reelin.ca';

    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
        webpush.setVapidDetails(
            VAPID_SUBJECT,
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
        );
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

        // Initialize Supabase Admin Client inside handler
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const bodyPayload = await req.json();
        const { userId, title, body, url, notificationTag, type } = bodyPayload;

        console.log('Push API received:', { userId, title, type });

        // Trace test only (for basic API verification)
        if (type === 'TRACE_TEST') {
            return NextResponse.json({ status: 'ok', message: 'Protocol verified', received: bodyPayload });
        }

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        let targetUserId = userId;

        // 1. Get subscriptions for this user
        let { data: subscriptions, error: subError } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', targetUserId);

        // EXTRA HEALING: If no subscriptions found, check if this ID is actually a Staff Record ID
        if (!subError && (!subscriptions || subscriptions.length === 0)) {
            console.log(`[Push API] No subs for original ID: ${targetUserId}. Checking if Staff ID...`);
            const { data: staffRecord, error: staffError } = await supabase
                .from('staff')
                .select('user_id, email, name')
                .eq('id', targetUserId)
                .single();

            if (staffError) {
                console.log(`[Push API] Staff lookup error for ${targetUserId}:`, staffError.message);
            }

            if (staffRecord?.user_id) {
                console.log(`[Push API] SUCCESS: Resolved ID ${targetUserId} (${staffRecord.name}) to User: ${staffRecord.user_id}`);
                targetUserId = staffRecord.user_id;

                // Re-fetch subscriptions with the resolved ID
                const { data: resolvedSubs } = await supabase
                    .from('push_subscriptions')
                    .select('*')
                    .eq('user_id', targetUserId);
                subscriptions = resolvedSubs;
            } else {
                console.log(`[Push API] FAILURE: No user_id found on staff record for ${targetUserId}. Name: ${staffRecord?.name}, Email: ${staffRecord?.email}`);
            }
        }

        if (subError) {
            console.error('Supabase error:', subError);
            return NextResponse.json({ error: subError.message }, { status: 500 });
        }

        if (!subscriptions || subscriptions.length === 0) {
            console.log('No subscriptions found for user:', userId);
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
