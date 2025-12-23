'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                router.refresh(); // Refresh to clear server component cache
                router.replace('/login'); // Force replace to avoid history stack issues
            }

            // Check for invalid session state aggressively
            if (!session && window.location.pathname.startsWith('/admin')) {
                // If we are on an admin page but have no session (e.g. after error), redirect
                router.replace('/login');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, supabase]);

    return <>{children}</>;
}
