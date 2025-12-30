import { createClient } from '@/lib/supabase';
import { Service, Staff, Appointment, TimeSlot } from '@/types';

const supabase = createClient();

// Helper to get the current user's organization
export const getCurrentUserOrganization = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    return profile?.org_id;
};

export const getUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return { user, profile };
};

export const getOrganizationBySlug = async (slug: string) => {
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) return null;
    return data;
};

// ...
export const getOrganizationById = async (id: string) => {
    const { data, error } = await supabase
        .from('organizations')
        .select(`
            id,
            slug,
            name,
            logo_url,
            primary_color,
            phone,
            email,
            address,
            website,
            terms_url,
            policy_url,
            slot_interval,
            business_hours
        `)
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
};

export const getServices = async (orgId: string): Promise<Service[]> => {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('org_id', orgId);

    if (error) {
        console.error('Error fetching services:', error);
        return [];
    }

    return data.map((item: any) => ({
        ...item,
        durationMinutes: item.duration_minutes
    }));
};

export const getStaff = async (orgId: string): Promise<Staff[]> => {
    const { data, error } = await supabase
        .from('staff')
        .select(`
            *,
            staff_services (
                service_id
            )
        `)
        .eq('org_id', orgId);

    if (error) {
        console.error('Error fetching staff:', error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        role: item.role,
        avatar: item.avatar_url,
        email: item.email, // Added email
        specialties: item.staff_services.map((ss: any) => ss.service_id)
    }));
};

// ...

export const createStaff = async (staff: Omit<Staff, 'id'>, orgId: string) => {
    // 1. Create Staff Member
    const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .insert([
            {
                name: staff.name,
                role: staff.role,
                avatar_url: staff.avatar,
                email: staff.email, // Added email
                org_id: orgId
            }
        ])
        .select()
        .single();

    if (staffError) throw staffError;

    // 2. Link Services (Many-to-Many)
    // For MVP we skip linking services on create, can add later

    return {
        ...staffData,
        avatar: staffData.avatar_url,
        specialties: []
    };
};

export const updateStaff = async (id: string, updates: Partial<Omit<Staff, 'id'>>, orgId: string) => {
    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.role) payload.role = updates.role;
    if (updates.avatar) payload.avatar_url = updates.avatar;
    if (updates.email) payload.email = updates.email; // Added email

    const { error } = await supabase
        .from('staff')
        .update(payload)
        .eq('id', id)
        .eq('org_id', orgId);

    if (error) throw error;
};
export const getAppointments = async (orgId?: string): Promise<Appointment[]> => {
    // If orgId is provided (public/specific check), filter by it.
    // If not, relying on RLS for admin view (which looks up profile)
    // For simplicity in this step, we will assume admin page passes it or rely on RLS if authenticated.

    let query = supabase
        .from('appointments')
        .select('*')
        .neq('status', 'ARCHIVED') // Hides "Confirm Cancelled" / Dismissed appointments
        .order('date', { ascending: false })
        .order('time_slot', { ascending: false })
        .limit(1000); // Increased from 50 for MVP scalability

    if (orgId) {
        query = query.eq('org_id', orgId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching appointments:', error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        serviceId: item.service_id,
        staffId: item.staff_id,
        clientId: item.client_email || 'unknown',
        clientName: item.client_name || 'Unknown Client',
        clientEmail: item.client_email || '',
        date: item.date,
        timeSlot: item.time_slot,
        status: item.status
    }));
};

export const createAppointment = async (appointment: Omit<Appointment, 'id' | 'status'>, orgId: string) => {
    // Check for double booking using the RPC function
    const { data, error } = await supabase
        .rpc('create_appointment_secure', {
            p_org_id: orgId,
            p_staff_id: appointment.staffId,
            p_service_id: appointment.serviceId,
            p_date: appointment.date,
            p_time_slot: appointment.timeSlot,
            p_client_name: appointment.clientName,
            p_client_email: appointment.clientEmail
        });

    if (error) {
        throw error;
    }

    // Check application-level error (e.g. Slot already booked)
    if (!data.success) {
        throw new Error(data.error || 'Failed to create appointment');
    }

    // Return the newly created ID, or just success
    return { id: data.data };
};

// --- Write Operations ---

export const createService = async (service: Omit<Service, 'id'>, orgId: string) => {
    const { data, error } = await supabase
        .from('services')
        .insert([
            {
                name: service.name,
                description: service.description,
                price: service.price,
                duration_minutes: service.durationMinutes,
                image_url: service.imageUrl,
                org_id: orgId
            }
        ])
        .select()
        .single();

    if (error) throw error;
    return {
        ...data,
        durationMinutes: data.duration_minutes,
        imageUrl: data.image_url
    };
};

export const updateService = async (id: string, updates: Partial<Omit<Service, 'id'>>, orgId: string) => {
    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.description) payload.description = updates.description;
    if (updates.price) payload.price = updates.price;
    if (updates.durationMinutes) payload.duration_minutes = updates.durationMinutes;
    if (updates.imageUrl) payload.image_url = updates.imageUrl;

    const { error } = await supabase
        .from('services')
        .update(payload)
        .eq('id', id)
        .eq('org_id', orgId);

    if (error) throw error;
};

export const deleteService = async (id: string, orgId: string) => {
    const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId);

    if (error) throw error;
};



export const updateStaffServices = async (staffId: string, serviceIds: string[]) => {
    // 1. Delete existing links
    const { error: deleteError } = await supabase
        .from('staff_services')
        .delete()
        .eq('staff_id', staffId);

    if (deleteError) throw deleteError;

    // 2. Insert new links
    if (serviceIds.length > 0) {
        const links = serviceIds.map(serviceId => ({
            staff_id: staffId,
            service_id: serviceId
        }));

        const { error: insertError } = await supabase
            .from('staff_services')
            .insert(links);

        if (insertError) throw insertError;
    }
};

export const deleteStaff = async (id: string, orgId: string) => {
    const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId);

    if (error) throw error;
};

export const checkActiveAppointments = async (type: 'staff' | 'service', id: string) => {
    const column = type === 'staff' ? 'staff_id' : 'service_id';
    const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq(column, id)
        .in('status', ['CONFIRMED', 'PENDING'])
        .gte('date', new Date().toISOString().split('T')[0]); // Only future/today

    if (error) throw error;
    return count || 0;
};

export const getAvailability = async (staffId: string) => {
    const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('staff_id', staffId)
        .order('day_of_week', { ascending: true });

    if (error) {
        console.error('Error fetching availability:', error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        staffId: item.staff_id,
        dayOfWeek: item.day_of_week,
        startTime: item.start_time,
        endTime: item.end_time,
        isWorking: item.is_working
    }));
};

export const getAllAvailability = async (orgId: string) => {
    const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('org_id', orgId);

    if (error) {
        console.error('Error fetching all availability:', error);
        return [];
    }

    return (data || []).map((item: any) => ({
        id: item.id,
        staffId: item.staff_id,
        dayOfWeek: item.day_of_week,
        startTime: item.start_time,
        endTime: item.end_time,
        isWorking: item.is_working
    }));
};

export const upsertAvailability = async (availabilityList: any[], staffId: string, orgId: string) => {
    // Transform camelCase to snake_case for DB
    const startData = availabilityList.map(item => ({
        staff_id: staffId,
        org_id: orgId,
        day_of_week: item.dayOfWeek,
        start_time: item.startTime,
        end_time: item.endTime,
        is_working: item.isWorking
    }));

    // We can't use simple upsert because we need to match on (staff_id, day_of_week).
    // Supabase upsert works if there is a unique constraint.
    // We added "unique(staff_id, day_of_week)" in the migration, so upsert should work!

    const { data, error } = await supabase
        .from('availability')
        .upsert(startData, { onConflict: 'staff_id,day_of_week' })
        .select();

    if (error) throw error;
    return data;
};

// ...
export const getAppointmentsByEmail = async (email: string) => {
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            services (name),
            staff (name)
        `)
        .eq('client_email', email)
        .order('date', { ascending: true })
        .gte('date', new Date().toISOString().split('T')[0]); // Only show today/future

    if (error) {
        console.error('Error fetching bookings:', error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        serviceId: item.service_id,
        staffId: item.staff_id,
        clientId: item.client_email,
        clientName: item.client_name,
        clientEmail: item.client_email,
        date: item.date,
        timeSlot: item.time_slot,
        status: item.status,
        // Optional enrichments if we updated types
        // serviceName: item.services?.name,
        // staffName: item.staff?.name
    }));
};

export const cancelAppointment = async (id: string) => {
    const { error } = await supabase
        .from('appointments')
        .update({ status: 'CANCELLED' })
        .eq('id', id);

    if (error) throw error;
};

export const updateAppointment = async (id: string, updates: { date?: string; timeSlot?: string; status?: string; staffId?: string }) => {
    // If moving time OR changing staff, verify availability first
    if (updates.date || updates.timeSlot || updates.staffId) {
        // Fetch current appointment to get current details (fallback)
        const { data: currentApt } = await supabase
            .from('appointments')
            .select('staff_id, date, time_slot')
            .eq('id', id)
            .single();

        if (!currentApt) throw new Error('Appointment not found');

        // Determine target values
        const targetStaffId = updates.staffId || currentApt.staff_id;
        const targetDate = updates.date || currentApt.date;
        const targetTime = updates.timeSlot || currentApt.time_slot;

        // Check for conflicts on the TARGET staff's schedule
        const { data: conflict } = await supabase
            .from('appointments')
            .select('id')
            .eq('staff_id', targetStaffId)
            .eq('date', targetDate)
            .eq('time_slot', targetTime)
            .neq('id', id) // Exclude self
            .neq('status', 'CANCELLED')
            .single();

        if (conflict) {
            throw new Error('This time slot is already booked for the selected staff member.');
        }
    }

    const payload: any = {};
    if (updates.date) payload.date = updates.date;
    if (updates.timeSlot) payload.time_slot = updates.timeSlot;
    if (updates.status) payload.status = updates.status;
    if (updates.staffId) payload.staff_id = updates.staffId;

    const { error } = await supabase
        .from('appointments')
        .update(payload)
        .eq('id', id);

    if (error) throw error;
};

export const uncancelAppointment = async (id: string) => {
    // 1. Check for conflicts before restoring
    const { data: currentApt } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();

    if (!currentApt) throw new Error('Appointment not found');

    const { data: conflict } = await supabase
        .from('appointments')
        .select('id')
        .eq('staff_id', currentApt.staff_id)
        .eq('date', currentApt.date)
        .eq('time_slot', currentApt.time_slot)
        .neq('id', id)
        .neq('status', 'CANCELLED')
        .neq('status', 'ARCHIVED')
        .single();

    if (conflict) {
        throw new Error('Cannot restore: Time slot is now taken.');
    }

    const { error } = await supabase
        .from('appointments')
        .update({ status: 'CONFIRMED' })
        .eq('id', id);

    if (error) throw error;
};

export const archiveAppointment = async (id: string) => {
    // We use a specific status 'ARCHIVED' to hide it from the board
    const { error } = await supabase
        .from('appointments')
        .update({ status: 'ARCHIVED' })
        .eq('id', id);

    if (error) throw error;
};

// --- Time Slot Logic ---

const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

const minutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const getTimeSlots = async (staffId: string, date: Date, serviceDuration: number, orgId: string): Promise<TimeSlot[]> => {
    // 1. Get Day of Week & Date String
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[date.getDay()];

    // SAFE LOCAL DATE STRING: Avoids UTC shifts
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    // 2. Fetch Org Settings for Interval & Business Hours
    const { data: org } = await supabase
        .from('organizations')
        .select('business_hours, slot_interval')
        .eq('id', orgId)
        .single();

    if (!org) return [];

    const orgHours = org.business_hours?.[dayName];
    const interval = org.slot_interval || 60;

    // Global Shop Close Check
    if (!orgHours || !orgHours.isOpen) return [];

    // 3. Fetch Staff Availability
    // We strictly respect the Staff's availability table.
    const { data: staffRule } = await supabase
        .from('availability')
        .select('*')
        .eq('staff_id', staffId)
        .eq('day_of_week', date.getDay())
        .single();

    if (!staffRule || !staffRule.is_working) return [];

    // 4. Calculate Effective Range
    // Staff rule defines their shift. Org hours define absolute limits.
    const shiftStart = timeToMinutes(staffRule.start_time);
    const shiftEnd = timeToMinutes(staffRule.end_time);

    const shopOpen = timeToMinutes(orgHours.open);
    const shopClose = timeToMinutes(orgHours.close);

    // The effective start is the max of shift/shop start
    // The effective end is the min of shift/shop end
    let currentMinutes = Math.max(shiftStart, shopOpen);
    const absoluteEnd = Math.min(shiftEnd, shopClose);

    // 5. Timezone & "Today" Logic
    // We must calculate "Now" in the Organization's Timezone to determine if a slot is in the past.
    // If org has no timezone, default to 'America/New_York' (or system default, but consistent).
    const orgTimezone = (org as any).timezone || 'America/New_York';

    // Get "Now" in Org Timezone
    // We use a simple trick: formatting "now" into the target timezone, then parsing it back as local components
    const now = new Date();
    const nowInOrgStr = now.toLocaleString('en-US', { timeZone: orgTimezone, hour12: false });
    const nowInOrg = new Date(nowInOrgStr);

    // Check if the requested date (YYYY-MM-DD from client) is "Today" in Org Time
    // safe date creation from YYYY-MM-DD
    const [reqY, reqM, reqD] = dateStr.split('-').map(Number);
    const isTodayInOrg = (
        nowInOrg.getFullYear() === reqY &&
        (nowInOrg.getMonth() + 1) === reqM &&
        nowInOrg.getDate() === reqD
    );

    // If it's today, we need to block past slots + lead time
    let startLimit = currentMinutes;
    if (isTodayInOrg) {
        const MIN_NOTICE_MINUTES = 60; // Increased to 1 hour for safety
        const currentOrgMinutes = nowInOrg.getHours() * 60 + nowInOrg.getMinutes();
        startLimit = Math.max(startLimit, currentOrgMinutes + MIN_NOTICE_MINUTES);

        // Snap to next interval
        const remainder = startLimit % interval;
        if (remainder > 0) {
            startLimit += (interval - remainder);
        }
    }

    // Use the calculated limit
    currentMinutes = Math.max(currentMinutes, startLimit);

    // 5. Fetch Existing Appointments (with Duration) for Collision Detection
    const { data: existingApts } = await supabase
        .from('appointments')
        .select(`
            time_slot,
            services ( duration_minutes )
        `)
        .eq('staff_id', staffId) // SCOPED: Checks ONLY this staff member
        .eq('date', dateStr)
        .in('status', ['CONFIRMED', 'PENDING']);

    const busyRanges = existingApts?.map((apt: any) => ({
        start: timeToMinutes(apt.time_slot),
        end: timeToMinutes(apt.time_slot) + (apt.services?.duration_minutes || 60)
    })) || [];

    const slots: TimeSlot[] = [];

    // 6. Generate Slots
    while (currentMinutes + serviceDuration <= absoluteEnd) {
        const slotStart = currentMinutes;
        const slotEnd = currentMinutes + serviceDuration;

        // Collision Check: Intersecting ranges
        // (StartA < EndB) && (EndA > StartB)
        const isBlocked = busyRanges.some(busy =>
            slotStart < busy.end && slotEnd > busy.start
        );

        if (!isBlocked) {
            slots.push({
                time: minutesToTime(slotStart),
                available: true
            });
        }

        // Increment by the global interval
        currentMinutes += interval;
    }

    return slots;
};

// --- Invitations ---

export const getInvitations = async (orgId?: string) => {
    // If orgId provided, we could filter. 
    // ADMIN view: see all invites created by this user or for this org.
    // For MVP: Fetch all valid invites.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Simple policy: fetch all invitations
    const { data, error } = await supabase
        .from('invitations')
        .select(`
            *,
            organizations (name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching invitations:', error);
        return [];
    }

    return data.map((item: any) => ({
        ...item,
        orgName: item.organizations?.name
    }));
};

export const createInvitation = async (code: string, role: string, orgId?: string) => {
    // Check if code exists
    const { data: existing } = await supabase
        .from('invitations')
        .select('id')
        .eq('code', code)
        .single();

    if (existing) {
        throw new Error('This code already exists.');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Must be logged in");

    const { data, error } = await supabase
        .from('invitations')
        .insert([{
            code,
            role,
            org_id: orgId || null,
            created_by: user.id
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteInvitation = async (id: string) => {
    const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id);
    if (error) throw error;
};
