import { createClient } from '@/lib/supabase';
import { Service, Staff, Appointment, TimeSlot } from '@/types';
import { format } from 'date-fns';


const supabase = createClient();

// --- INVITATIONS (SUPER ADMIN) ---
export const getInvitations = async () => {
    const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const createInvitation = async (code: string, role: string = 'owner') => {
    const { data, error } = await supabase
        .from('invitations')
        .insert([{ code, role }]);
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

// --- AUTH & PROFILE ---

export const getCurrentUserOrganization = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('[getCurrentUserOrganization] Profile Error:', error);
    }

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

export const updateUserProfile = async (userId: string, orgId: string, updates: { fullName?: string; avatarUrl?: string }) => {
    const profilePayload: any = {};
    if (updates.fullName) profilePayload.full_name = updates.fullName;
    if (updates.avatarUrl) profilePayload.avatar_url = updates.avatarUrl;

    // 1. Update Profile
    const { error: profileError } = await supabase
        .from('profiles')
        .update(profilePayload)
        .eq('id', userId);

    if (profileError) throw profileError;

    // 2. Update Staff (if linked)
    const staffPayload: any = {};
    if (updates.fullName) staffPayload.name = updates.fullName;
    if (updates.avatarUrl) staffPayload.avatar_url = updates.avatarUrl;

    const { error: staffError } = await supabase
        .from('staff')
        .update(staffPayload)
        .eq('user_id', userId)
        .eq('org_id', orgId);

    if (staffError) {
        console.warn('[updateUserProfile] Staff update failed (might not be a staff member):', staffError.message);
    }
};

// --- ORGANIZATIONS ---

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
            business_hours,
            settings
        `)
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
};

// --- SERVICES ---

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
        durationMinutes: item.duration_minutes,
        imageUrl: item.image_url,
        intakeQuestions: item.intake_questions
    }));
};

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
                intake_questions: service.intakeQuestions || [],
                org_id: orgId
            }
        ])
        .select()
        .single();

    if (error) throw error;
    return {
        ...data,
        durationMinutes: data.duration_minutes,
        imageUrl: data.image_url,
        intakeQuestions: data.intake_questions
    };
};

export const updateService = async (id: string, updates: Partial<Omit<Service, 'id'>>, orgId: string) => {
    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.description) payload.description = updates.description;
    if (updates.price) payload.price = updates.price;
    if (updates.durationMinutes) payload.duration_minutes = updates.durationMinutes;
    if (updates.imageUrl) payload.image_url = updates.imageUrl;
    if (updates.intakeQuestions) payload.intake_questions = updates.intakeQuestions;

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

// --- STAFF ---

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
        userId: item.user_id,
        name: item.name,
        role: item.role,
        avatar: item.avatar_url,
        email: item.email,
        specialties: item.staff_services?.map((ss: any) => ss.service_id) || []
    }));
};

export const createStaff = async (staff: Omit<Staff, 'id'>, orgId: string) => {
    const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .insert([
            {
                name: staff.name,
                role: staff.role,
                avatar_url: staff.avatar,
                email: staff.email,
                org_id: orgId
            }
        ])
        .select()
        .single();

    if (staffError) throw staffError;

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
    if (updates.email) payload.email = updates.email;

    const { error } = await supabase
        .from('staff')
        .update(payload)
        .eq('id', id)
        .eq('org_id', orgId);

    if (error) throw error;
};

export const deleteStaff = async (id: string, orgId: string) => {
    const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId);
    if (error) throw error;
};

export const updateStaffServices = async (staffId: string, serviceIds: string[]) => {
    await supabase.from('staff_services').delete().eq('staff_id', staffId);

    if (serviceIds.length > 0) {
        const { error } = await supabase
            .from('staff_services')
            .insert(serviceIds.map(sid => ({ staff_id: staffId, service_id: sid })));
        if (error) throw error;
    }
};

// --- APPOINTMENTS ---

export const getAppointments = async (orgId: string, startDate?: string, endDate?: string): Promise<Appointment[]> => {
    let query = supabase
        .from('appointments')
        .select(`
            *,
            service_name,
            service_price,
            staff_name
        `)
        .eq('org_id', orgId);

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching appointments:', JSON.stringify(error, null, 2));
        return [];
    }

    return (data || []).map((item: any) => {
        const service = Array.isArray(item.services) ? item.services[0] : item.services;
        const mappedDuration = item.duration_minutes !== null ? item.duration_minutes : (service?.duration_minutes || 60);


        return {
            id: item.id,
            serviceId: item.service_id,
            serviceName: item.service_name || service?.name || 'Unknown Service',
            staffId: item.staff_id,
            staffName: item.staff_name || 'Staff',
            price: item.service_price || service?.price || 0,
            clientId: '',
            clientName: item.client_name || 'Unknown',
            clientEmail: item.client_email || '',
            clientPhone: item.client_phone || '',
            date: item.date,
            timeSlot: item.time_slot,
            status: item.status as any,
            notes: item.notes,
            durationMinutes: mappedDuration,
            bufferMinutes: item.buffer_minutes !== null ? item.buffer_minutes : (service?.buffer_time_minutes || 0)
        };
    });
};

export const getAppointmentsByEmail = async (email: string): Promise<Appointment[]> => {
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('clientEmail', email)
        .order('date', { ascending: false })
        .order('timeSlot', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const createAppointment = async (appointment: Partial<Appointment>, orgId: string) => {
    // NEW: Generate a unique ID for this request if not provided
    const idempotencyKey = appointment.idempotencyKey || crypto.randomUUID();

    const { data, error } = await supabase.rpc('create_appointment_v3', {
        p_org_id: orgId,
        p_service_id: appointment.serviceId,
        p_staff_id: appointment.staffId === 'any' ? null : appointment.staffId,
        p_client_name: appointment.clientName,
        p_client_email: appointment.clientEmail,
        p_client_phone: appointment.clientPhone || null,
        p_date: appointment.date,
        p_time_slot: appointment.timeSlot,
        p_notes: appointment.notes,
        p_duration_minutes: appointment.durationMinutes,
        p_buffer_minutes: appointment.bufferMinutes,
        p_idempotency_key: idempotencyKey
    });

    if (error) throw error;
    return data; // Return full JSON object { appointment_id, staff_id, staff_name }
};

export const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    const payload: any = {};
    if (updates.date) payload.date = updates.date;
    if (updates.timeSlot) payload.time_slot = updates.timeSlot;
    if (updates.staffId) payload.staff_id = updates.staffId;
    if (updates.status) payload.status = updates.status;
    if (updates.durationMinutes) payload.duration_minutes = updates.durationMinutes;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.clientEmail) payload.client_email = updates.clientEmail;
    if (updates.clientPhone !== undefined) payload.client_phone = updates.clientPhone;
    if (updates.clientName) payload.client_name = updates.clientName;

    const { error } = await supabase
        .from('appointments')
        .update(payload)
        .eq('id', id);
    if (error) throw error;
};

export const cancelAppointment = async (id: string) => {
    const { error } = await supabase
        .from('appointments')
        .update({ status: 'CANCELLED' })
        .eq('id', id);
    if (error) throw error;
};

export const uncancelAppointment = async (id: string) => {
    const { error } = await supabase
        .from('appointments')
        .update({ status: 'CONFIRMED' })
        .eq('id', id);
    if (error) throw error;
};

export const archiveAppointment = async (id: string) => {
    const { error } = await supabase
        .from('appointments')
        .update({ status: 'ARCHIVED' })
        .eq('id', id);
    if (error) throw error;
};

export const checkActiveAppointments = async (type: 'staff' | 'service', id: string) => {
    const column = type === 'staff' ? 'staff_id' : 'service_id';
    const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq(column, id)
        .not('status', 'in', '("cancelled", "archived")');

    if (error) {
        console.error('Error checking active appointments:', error);
        return 0;
    }
    return count || 0;
};

// --- AVAILABILITY ---

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

export const getAvailability = async (staffId: string) => {
    const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('staff_id', staffId);

    if (error) throw error;

    return (data || []).map((item: any) => ({
        id: item.id,
        staffId: item.staff_id,
        dayOfWeek: item.day_of_week,
        startTime: item.start_time,
        endTime: item.end_time,
        isWorking: item.is_working
    }));
};

export const upsertAvailability = async (schedule: any[], staffId: string, orgId: string) => {
    const payloads = schedule.map(s => ({
        staff_id: staffId,
        org_id: orgId,
        day_of_week: s.dayOfWeek,
        start_time: s.startTime,
        end_time: s.endTime,
        is_working: s.isWorking
    }));

    await supabase.from('availability').delete().eq('staff_id', staffId);
    const { error } = await supabase.from('availability').insert(payloads);
    if (error) throw error;
};

// --- TIME SLOTS LOGIC ---

export const getTimeSlots = async (staffId: string, date: Date, duration: number, orgId: string, bufferMinutes: number = 0): Promise<TimeSlot[]> => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay();

    const { data: org } = await supabase
        .from('organizations')
        .select('slot_interval, business_hours, settings')
        .eq('id', orgId)
        .single();

    const interval = org?.slot_interval || 30;

    // Check for Holidays/Closures
    const holidays = org?.settings?.scheduling?.holidays || [];
    if (holidays.includes(dateStr)) {
        return [];
    }

    const { data: availability } = await supabase
        .from('availability')
        .select('*')
        .eq('staff_id', staffId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_working', true)
        .single();

    if (!availability) return [];

    const { data: appointments } = await supabase
        .from('appointments')
        .select('time_slot, duration_minutes, buffer_minutes')
        .eq('staff_id', staffId)
        .eq('date', dateStr)
        .not('status', 'in', '("cancelled", "archived")');

    const slots: TimeSlot[] = [];
    let current = new Date(`${dateStr}T${availability.start_time}`);
    const end = new Date(`${dateStr}T${availability.end_time}`);

    while (current < end) {
        const timeStr = format(current, 'HH:mm');

        const slotStart = new Date(`${dateStr}T${timeStr}`);
        const slotEnd = new Date(slotStart.getTime() + (duration + bufferMinutes) * 60000);
        const overflowsBusinessHours = slotEnd > end;

        const isBusy = (appointments || []).some(apt => {
            const aptStart = new Date(`${dateStr}T${apt.time_slot}`);
            const aptDuration = apt.duration_minutes || 60; // Fallback to 60m if null
            const aptEnd = new Date(aptStart.getTime() + (aptDuration + (apt.buffer_minutes || 0)) * 60000);

            return (slotStart < aptEnd && slotEnd > aptStart);
        });

        // Min Notice Check
        const minNoticeValue = org?.settings?.scheduling?.min_notice_value ?? 4;
        const minNoticeUnit = org?.settings?.scheduling?.min_notice_unit || 'hours';
        let minNoticeMinutes = minNoticeValue;
        if (minNoticeUnit === 'hours') minNoticeMinutes = minNoticeValue * 60;
        if (minNoticeUnit === 'days') minNoticeMinutes = minNoticeValue * 1440;
        const now = new Date();
        const noticeThreshold = new Date(now.getTime() + minNoticeMinutes * 60000);
        const satisfiesNotice = slotStart >= noticeThreshold;

        slots.push({
            time: timeStr,
            available: !isBusy && !overflowsBusinessHours && satisfiesNotice
        });

        current = new Date(current.getTime() + interval * 60000);
    }

    return slots;
};
// --- PUSH NOTIFICATIONS ---

export const savePushSubscription = async (userId: string, subscription: any) => {
    const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert([{ user_id: userId, subscription }], { onConflict: 'user_id, subscription' });
    if (error) throw error;
    return data;
};

export const deletePushSubscription = async (userId: string, subscription: any) => {
    const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('subscription', JSON.stringify(subscription));
    if (error) throw error;
};

export const getUserSubscriptions = async (userId: string) => {
    const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);
    if (error) throw error;
    return data;
};

export const linkStaffAccount = async () => {
    const { data, error } = await supabase
        .rpc('link_staff_account');
    if (error) throw error;
    return data;
};

export const syncSubscription = async (userId: string, subscription: any) => {
    // This ensures that if a browser already HAS a subscription object,
    // it is definitely linked to the CURRENT active user.
    const { error } = await supabase
        .from('push_subscriptions')
        .update({ user_id: userId })
        .eq('subscription', JSON.stringify(subscription));

    // Also do an upsert just in case the subscription isn't in DB yet
    await savePushSubscription(userId, subscription);

    if (error) console.warn('[syncSubscription] Error:', error.message);
};
