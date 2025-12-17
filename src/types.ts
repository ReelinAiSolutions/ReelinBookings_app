export enum UserRole {
    CLIENT = 'CLIENT',
    PROVIDER = 'PROVIDER',
    ADMIN = 'ADMIN'
}

export enum AppointmentStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED'
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
