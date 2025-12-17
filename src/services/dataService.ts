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

export const getOrganizationBySlug = async (slug: string) => {
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) return null;
    return data;
};

export const getOrganizationById = async (id: string) => {
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
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
        specialties: item.staff_services.map((ss: any) => ss.service_id)
    }));
};

export const getAppointments = async (orgId?: string): Promise<Appointment[]> => {
    // If orgId is provided (public/specific check), filter by it.
    // If not, relying on RLS for admin view (which looks up profile)
    // For simplicity in this step, we will assume admin page passes it or rely on RLS if authenticated.

    let query = supabase
        .from('appointments')
        .select('*')
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
        .in('status', ['CONFIRMED', 'PENDING']);

    if (existingApts) {
        const bookedTimes = new Set(existingApts.map((a: any) => a.time_slot));
        return slots.map(slot => ({
            ...slot,
            available: !bookedTimes.has(slot.time)
        }));
    }

    return slots;
};
