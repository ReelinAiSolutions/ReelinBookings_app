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
            website
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
        .limit(50);

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
        clientId: item.client_email, // Approximate for list view
        clientName: item.client_name,
        clientEmail: item.client_email,
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

export const createStaff = async (staff: Omit<Staff, 'id'>, orgId: string) => {
    // 1. Create Staff Member
    const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .insert([
            {
                name: staff.name,
                role: staff.role,
                avatar_url: staff.avatar,
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

    const { error } = await supabase
        .from('staff')
        .update(payload)
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

export const updateAppointment = async (id: string, updates: { date?: string; timeSlot?: string; status?: string }) => {
    // If moving time, verify availability first (simple check)
    if (updates.date && updates.timeSlot) {
        // We need staffId to check conflicts. 
        // Fetch current appointment to get staffId
        const { data: currentApt } = await supabase
            .from('appointments')
            .select('staff_id')
            .eq('id', id)
            .single();

        if (!currentApt) throw new Error('Appointment not found');

        // Check for conflicts
        const { data: conflict } = await supabase
            .from('appointments')
            .select('id')
            .eq('staff_id', currentApt.staff_id)
            .eq('date', updates.date)
            .eq('time_slot', updates.timeSlot)
            .neq('id', id) // Exclude self
            .neq('status', 'CANCELLED')
            .single();

        if (conflict) {
            throw new Error('This time slot is already booked.');
        }
    }

    const payload: any = {};
    if (updates.date) payload.date = updates.date;
    if (updates.timeSlot) payload.time_slot = updates.timeSlot;
    if (updates.status) payload.status = updates.status;

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

export const getTimeSlots = async (staffId: string, date: Date): Promise<TimeSlot[]> => {
    // 1. Get Day of Week (0-6)
    const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon

    // 2. Fetch Rule for this day
    const { data: rule } = await supabase
        .from('availability')
        .select('*')
        .eq('staff_id', staffId)
        .eq('day_of_week', dayOfWeek)
        .single();

    // If no rule or not working, return closed
    if (!rule || !rule.is_working) {
        return [];
    }

    // 3. Generate Slots between Start and End
    // Simple implementation: 60 min slots
    const slots: TimeSlot[] = [];
    let currentHour = parseInt(rule.start_time.split(':')[0]);
    const endHour = parseInt(rule.end_time.split(':')[0]);

    while (currentHour < endHour) {
        const timeString = `${currentHour.toString().padStart(2, '0')}:00`;

        // Check if ANY existing appointment conflicts with this time
        // Note: Real apps do this more efficiently at the DB level, 
        // but for MVP we will fetch existing appointments for this day.

        // Only add if future or today+future time (simple "after now" check omitted for ease of testing)
        slots.push({
            time: timeString,
            available: true // We'll filter taken slots in the next step
        });
        currentHour++;
    }

    // 4. Filter Booked Slots
    const dateStr = date.toISOString().split('T')[0];
    const { data: existingApts } = await supabase
        .from('appointments')
        .select('time_slot')
        .eq('staff_id', staffId)
        .eq('date', dateStr)
        .in('status', ['CONFIRMED', 'PENDING']); // implicit: cancelled/archived are not blocking

    if (existingApts) {
        const bookedTimes = new Set(existingApts.map((a: any) => a.time_slot));
        return slots.map(slot => ({
            ...slot,
            available: !bookedTimes.has(slot.time)
        }));
    }

    return slots;
};
