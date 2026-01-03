import { createClient } from '@/lib/supabase';
'use client';

import { useEffect, useState } from 'react';


export default function DebugAdminPage() {
    const [debug, setDebug] = useState<any>({});

    useEffect(() => {
        const checkAdminData = async () => {
            const supabase = createClient();

            // Simulate what admin page does
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setDebug({ error: 'Not logged in' });
                return;
            }

            // Get profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            const orgId = profile?.org_id;

            if (!orgId) {
                setDebug({ error: 'No org_id in profile', profile });
                return;
            }

            // Get org
            const { data: org, error: orgError } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', orgId)
                .single();

            // Get services for this org
            const { data: services, error: servicesError } = await supabase
                .from('services')
                .select('*')
                .eq('org_id', orgId);

            // Get staff for this org
            const { data: staff, error: staffError } = await supabase
                .from('staff')
                .select('*')
                .eq('org_id', orgId);

            setDebug({
                user: { id: user.id, email: user.email },
                profile,
                orgId,
                org,
                orgError,
                services,
                servicesError,
                servicesCount: services?.length || 0,
                staff,
                staffError,
                staffCount: staff?.length || 0
            });
        };

        checkAdminData();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Admin Page Data Loading Debug</h1>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                {JSON.stringify(debug, null, 2)}
            </pre>
        </div>
    );
}
