import { Service, Staff, Appointment, AppointmentStatus } from '../types';

export const MOCK_SERVICES: Service[] = [
    {
        id: 's1',
        name: 'Consultation',
        description: 'Initial assessment and planning session for new clients.',
        durationMinutes: 30,
        price: 50,
        imageUrl: 'https://picsum.photos/400/300?random=1'
    },
    {
        id: 's2',
        name: 'Standard Haircut',
        description: 'Complete wash, cut, and style with premium products.',
        durationMinutes: 45,
        price: 75,
        imageUrl: 'https://picsum.photos/400/300?random=2'
    },
    {
        id: 's3',
        name: 'Deep Tissue Massage',
        description: 'Therapeutic massage focusing on realignment of deeper layers of muscles.',
        durationMinutes: 60,
        price: 120,
        imageUrl: 'https://picsum.photos/400/300?random=3'
    }
];

export const MOCK_STAFF: Staff[] = [
    {
        id: 'st1',
        name: 'Sarah Jenkins',
        role: 'Senior Stylist',
        specialties: ['s2', 's1'],
        avatar: 'https://picsum.photos/100/100?random=4'
    },
    {
        id: 'st2',
        name: 'Mike Ross',
        role: 'Massage Therapist',
        specialties: ['s3', 's1'],
        avatar: 'https://picsum.photos/100/100?random=5'
    }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
    {
        id: 'a1',
        serviceId: 's2',
        staffId: 'st1',
        clientId: 'c1',
        clientName: 'Alice Doe',
        clientEmail: 'alice@example.com',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '10:00',
        status: AppointmentStatus.CONFIRMED
    },
    {
        id: 'a2',
        serviceId: 's3',
        staffId: 'st2',
        clientId: 'c2',
        clientName: 'Bob Smith',
        clientEmail: 'bob@example.com',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '14:00',
        status: AppointmentStatus.PENDING
    }
];
