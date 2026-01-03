export enum UserRole {
    CLIENT = 'CLIENT',
    PROVIDER = 'PROVIDER',
    ADMIN = 'ADMIN'
}

export enum AppointmentStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
    ARCHIVED = 'ARCHIVED',
    ARRIVED = 'ARRIVED',
    IN_PROGRESS = 'IN_PROGRESS',
    NO_SHOW = 'NO_SHOW',
    BLOCKED = 'BLOCKED'
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
}

export interface Service {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
    imageUrl?: string;
    category?: string;
    categoryColor?: string;
    isVisible?: boolean;
    bufferTimeMinutes?: number;
    depositRequired?: boolean;
    depositAmount?: number;
    cancellationHours?: number;
    maxCapacity?: number;
    displayOrder?: number;
}

export interface ServicePricingTier {
    id: string;
    serviceId: string;
    tierName: string;
    price: number;
}

export interface ServiceAddon {
    id: string;
    serviceId: string;
    addonName: string;
    addonPrice: number;
    durationMinutes: number;
}

export interface Staff {
    id: string;
    userId?: string; // Auth User ID for notifications
    name: string;
    role: string;
    specialties: string[]; // Service IDs
    avatar: string;
    email?: string; // Optional for migration support, but intended to be populated
}

export interface Appointment {
    id: string;
    serviceId: string;
    staffId: string;
    clientId: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string; // Added field
    date: string; // ISO String for date part
    timeSlot: string; // "10:00"
    status: AppointmentStatus;
    notes?: string;
    durationMinutes?: number;
    bufferMinutes?: number;
    serviceName?: string;
}

export interface TimeSlot {
    time: string;
    available: boolean;
}

export interface Availability {
    id?: string;
    staffId: string;
    dayOfWeek: number; // 0 = Sunday, 1 = Monday
    startTime: string; // "09:00"
    endTime: string; // "17:00"
    isWorking: boolean;
}

export interface Organization {
    id: string;
    slug: string;
    name: string;
    logo_url?: string;
    primary_color?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    terms_url?: string;
    policy_url?: string;
    slot_interval?: number;
    business_hours?: Record<string, { open: string; close: string; isOpen: boolean }>;
    settings?: {
        color_mode?: 'staff' | 'service';
        scheduling?: {
            min_notice_hours?: number;
            max_advance_days?: number;
            buffer_minutes?: number;
        };
        policies?: {
            cancellation_policy?: string;
        };
        notifications?: {
            all_bookings?: boolean;
        };
    };
}
