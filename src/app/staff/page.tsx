'use client';

import React, { useState, useEffect } from 'react';
import StaffDashboard from '@/components/barber/BarberDashboard';
import {
    getCurrentUserOrganization,
    getUserProfile,
    getAppointments,
    getServices,
    getStaff,
    updateAppointment,
    getOrganizationById,
    getAllAvailability
} from '@/services/dataService';
import { useRouter } from 'next/navigation';
import { Organization, Appointment } from '@/types';

export default function StaffPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [availability, setAvailability] = useState<any[]>([]);
    const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const loadStaffData = async () => {
        try {
            const orgId = await getCurrentUserOrganization();
            if (!orgId) {
                router.push('/login?login=true');
                return;
            }

            const [fetchedApts, fetchedServices, fetchedStaff, fetchedAvailability, fetchedOrg, fetchedProfile] = await Promise.all([
                getAppointments(orgId),
                getServices(orgId),
                getStaff(orgId),
                getAllAvailability(orgId),
                getOrganizationById(orgId),
                getUserProfile()
            ]);

            setAppointments(fetchedApts || []);
            setServices(fetchedServices || []);
            setStaff(fetchedStaff || []);
            setAvailability(fetchedAvailability || []);
            setCurrentOrg(fetchedOrg as Organization);

            if (fetchedProfile) {
                setCurrentUser(fetchedProfile.user);
                setUserProfile(fetchedProfile.profile);

                // Redirect owners/admins to /admin unless in test view
                const params = new URLSearchParams(window.location.search);
                const isTestView = params.get('test_view') === 'true';

                if (!isTestView && (fetchedProfile.profile.role === 'owner' || fetchedProfile.profile.role === 'admin' || fetchedProfile.profile.role === 'ADMIN')) {
                    router.push('/admin');
                }
            }
        } catch (error) {
            console.error("Staff Data Load Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStaffData();
    }, []);

    const onStatusUpdate = async (id: string, newStatus: string) => {
        await updateAppointment(id, { status: newStatus });
        await loadStaffData();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <img src="/icon-180.png" alt="Reelin Bookings" className="w-20 h-20 animate-pulse" />
                    <h2 className="text-xl font-bold text-gray-900">Loading Team Portal...</h2>
                </div>
            </div>
        );
    }

    // Find matching staff record by email
    const matchedStaff = currentUser?.email ? staff.find(s => s.email === currentUser.email) : null;
    const displayStaffId = matchedStaff?.id;

    return (
        <StaffDashboard
            appointments={appointments}
            currentUser={currentUser || { id: 'loading' }}
            currentStaffId={displayStaffId}
            services={services}
            staff={staff}
            availability={availability}
            currentOrg={currentOrg}
            onStatusUpdate={onStatusUpdate}
            onRefresh={loadStaffData}
        />
    );
}
