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
    NO_SHOW = 'NO_SHOW'
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
}

export interface Staff {
    id: string;
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
    date: string; // ISO String for date part
    timeSlot: string; // "10:00"
    status: AppointmentStatus;
    notes?: string;
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
}
