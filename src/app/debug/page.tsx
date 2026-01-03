import { createClient } from '@/lib/supabase';
'use client';

import { useEffect, useState } from 'react';


export default function DebugPage() {
    const [debug, setDebug] = useState<any>({});

    useEffect(() => {
        const checkData = async () => {
            const supabase = createClient();

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setDebug({ error: 'Not logged in' });
                return;
            }

            // Get user profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            // Get organization if org_id exists
            let org = null;
            if (profile?.org_id) {
                const { data: orgData } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', profile.org_id)
                    .single();
                org = orgData;
            }

            // Get all organizations (to see if any exist)
            const { data: allOrgs } = await supabase
                .from('organizations')
                .select('*');

            // Get services
            const { data: services } = await supabase
                .from('services')
                .select('*');

            // Get staff
            const { data: staff } = await supabase
                .from('staff')
                .select('*');

            setDebug({
                user: { id: user.id, email: user.email },
                profile,
                org,
                allOrgs,
                services,
                staff
            });
        };

        checkData();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Database Debug Info</h1>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                {JSON.stringify(debug, null, 2)}
            </pre>
        </div>
    );
}
