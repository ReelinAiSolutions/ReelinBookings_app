import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import * as webpush from "https://esm.sh/web-push@3.6.6"

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = "mailto:admin@reelin.ca"; // Should be updated to business email

webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

serve(async (req) => {
    try {
        const { userId, title, body, url, notificationTag } = await req.json();

        // 1. Get subscriptions for this user from Supabase
        // We expect the auth header to be present or use service role
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const response = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?user_id=eq.${userId}`, {
            headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`
            }
        });

        const subscriptions = await response.json();

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({ message: "No subscriptions found" }), { status: 200 });
        }

        // 2. Send push to each device
        const results = await Promise.allSettled(
            subscriptions.map(async (sub: any) => {
                try {
                    await webpush.sendNotification(sub.subscription, JSON.stringify({
                        title,
                        body,
                        url: url || "/admin",
                        tag: notificationTag
                    }));
                } catch (err) {
                    // If subscription is expired/invalid, we should delete it
                    if (err.statusCode === 404 || err.statusCode === 410) {
                        await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?id=eq.${sub.id}`, {
                            method: "DELETE",
                            headers: {
                                "apikey": supabaseKey,
                                "Authorization": `Bearer ${supabaseKey}`
                            }
                        });
                    }
                    throw err;
                }
            })
        );

        return new Response(JSON.stringify({ results }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        });
    }
})
