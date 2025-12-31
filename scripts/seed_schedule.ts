
import { createClient } from '@supabase/supabase-js';
import { addDays, format, startOfToday } from 'date-fns';
import fs from 'fs';
import path from 'path';

try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                process.env[match[1].trim()] = match[2].trim().replace(/^["'](.*)["']$/, '$1');
            }
        });
    }
} catch (e) {
    console.log('Could not load .env.local', e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Starting seed...');

    let organizationId: string | null = null;

    // Strategy: Find an active organization that has STAFF.
    // This prevents picking an empty organization.
    const { data: activeStaff } = await supabase.from('staff').select('org_id').limit(1);

    if (activeStaff && activeStaff.length > 0) {
        organizationId = activeStaff[0].org_id;
        console.log('Found Active Organization ID via Staff:', organizationId);
    } else {
        // Fallback: Try profiles
        const { data: activeProfile } = await supabase.from('profiles').select('organization_id').neq('organization_id', null).limit(1);
        if (activeProfile && activeProfile.length > 0) {
            organizationId = activeProfile[0].organization_id;
            console.log('Found Active Organization ID via Profile:', organizationId);
        } else {
            // Last resort: Organizations table
            const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
            if (orgs && orgs.length > 0) {
                organizationId = orgs[0].id;
                console.log('Found Organization ID via Org Table (Might be empty):', organizationId);
            }
        }
    }

    if (!organizationId) {
        console.error('Could not find any organization_id. Seeding aborted.');
        return;
    }

    // Filter Staff by Organization
    let staff: any[] = [];
    const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('org_id', organizationId);

    if (!staffError && staffData && staffData.length > 0) {
        staff = staffData;
        console.log(`Found ${staff.length} staff in 'staff' table.`);
    } else {
        const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .eq('organization_id', organizationId)
            .or('role.eq.staff,role.eq.provider,role.eq.admin');

        if (profilesData && profilesData.length > 0) {
            staff = profilesData;
            console.log(`Found ${staff.length} staff in 'profiles' table.`);
        }
    }

    if (staff.length === 0) {
        console.error('No staff found for this organization.');
        return;
    }

    // Filter Services by Organization
    const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('org_id', organizationId);

    if (servicesError || !services || services.length === 0) {
        console.error('Error fetching services for org:', servicesError);
        return;
    }
    console.log(`Found ${services.length} services.`);

    const today = startOfToday();
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < 7; i++) {
        const currentDate = addDays(today, i);
        const dateStr = format(currentDate, 'yyyy-MM-dd');

        for (const person of staff) {
            const dailyCount = Math.floor(Math.random() * 5) + 4; // 4-8

            const usedTimes = new Set<string>();

            for (let j = 0; j < dailyCount; j++) {
                const service = services[Math.floor(Math.random() * services.length)];

                // Random time 9AM - 5PM
                let hour = Math.floor(Math.random() * (17 - 9)) + 9;
                let minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];

                const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                if (usedTimes.has(timeSlot)) continue;
                usedTimes.add(timeSlot);

                const payload = {
                    p_org_id: organizationId,
                    p_staff_id: person.id,
                    p_service_id: service.id,
                    p_date: dateStr,
                    p_time_slot: timeSlot,
                    p_client_name: `Guest ${Math.floor(Math.random() * 1000)}`,
                    p_client_email: `guest${Math.floor(Math.random() * 1000)}@example.com`
                };

                try {
                    const { data, error } = await supabase.rpc('create_appointment_secure', payload);

                    if (error) {
                        if (failCount < 3) console.error('RPC Error:', error.message);
                        failCount++;
                    } else if (data && !data.success) {
                        if (failCount < 3) console.error('App Logic Error:', data.error);
                        failCount++;
                    } else {
                        successCount++;
                    }
                } catch (e: any) {
                    failCount++;
                }
            }
        }
    }

    console.log(`Seed complete. Created: ${successCount}. Failed: ${failCount}`);
}

seed().catch(console.error);
