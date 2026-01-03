import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Hardcoded safety net for browser client
    if (!supabaseUrl || supabaseUrl === 'your-project-url') {
        supabaseUrl = 'https://jqnrzctlxsxxxqogeidg.supabase.co';
    }
    if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key') {
        supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxbnJ6Y3RseHN4eHhxb2dlaWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NTE5MDUsImV4cCI6MjA4MTUyNzkwNX0.Q0wcSV744Ko1AXzsnYRxwqpTgt4XtE9qHCAaKilNFws';
    }

    return createBrowserClient(
        supabaseUrl!,
        supabaseAnonKey!
    )
}
