'use client';

import React, { useState, useEffect } from 'react';
import DashboardStats from '@/components/admin/DashboardStats';
import AdminSidebar from '@/components/admin/AdminSidebar';
import DashboardCharts from '@/components/admin/DashboardCharts';
import AppointmentList from '@/components/admin/AppointmentList';
import ServiceManager from '@/components/admin/ServiceManager';
import StaffManager from '@/components/admin/StaffManager';
import AnalyticsView from '@/components/admin/AnalyticsView';
import WeeklyCalendar from '@/components/admin/WeeklyCalendar';
import TodayPanel from '@/components/admin/TodayPanel';
import RescheduleModal from '@/components/admin/RescheduleModal';
import BlockModal from '@/components/admin/BlockModal';
import CreateAppointmentModal from '@/components/admin/CreateAppointmentModal';
import BarberDashboard from '@/components/barber/BarberDashboard';
import ProfileManager from '@/components/admin/ProfileManager'; // Restored import
import AdminNav from '@/components/admin/AdminNav'; // New import
import {
    getCurrentUserOrganization,
    getUserProfile,
    getAppointments,
    getServices,
    getStaff,
    createAppointment,
    createService,
    deleteService,
    updateService,
    updateAppointment,
    cancelAppointment,
    uncancelAppointment,
    archiveAppointment,
    getOrganizationById,
    getAllAvailability
} from '@/services/dataService';
import Link from 'next/link';
import { ExternalLink, Plus, Lock, X } from 'lucide-react';
import { Organization, Appointment } from '@/types';

const MOCK_STATS = [
    { name: 'Mon', bookings: 4, revenue: 240 },
    { name: 'Tue', bookings: 7, revenue: 525 },
    { name: 'Wed', bookings: 5, revenue: 410 },
    { name: 'Thu', bookings: 8, revenue: 650 },
    { name: 'Fri', bookings: 12, revenue: 980 },
    { name: 'Sat', bookings: 15, revenue: 1200 },
    { name: 'Sun', bookings: 9, revenue: 700 },
];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'operations' | 'services' | 'team' | 'analytics' | 'settings' | 'profile' | 'invites'>('operations');
    const [appointments, setAppointments] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalRevenue: 0, totalBookings: 0, activeStaff: 0 });
    const [services, setServices] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [availability, setAvailability] = useState<any[]>([]); // New state
    const [chartData, setChartData] = useState<any[]>(MOCK_STATS);
    const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null); // New state
    const [userProfile, setUserProfile] = useState<any>(null); // New state

    // Modal State
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

    // Blocking State
    const [isBlockingMode, setIsBlockingMode] = useState(false);
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [blockSelection, setBlockSelection] = useState<{ date: Date | null, time: string | null }>({ date: null, time: null });

    // Staff Filter State
    const [selectedStaffId, setSelectedStaffId] = useState<string>('ALL');

    const loadDashboardData = async () => {
        try {
            const orgId = await getCurrentUserOrganization();
            if (!orgId) {
                // If checking auth fails or no org, we might redirect or just wait
                // window.location.href = '/login?error=no_org'; 
                // Redirecting in useEffect can be tricky, safe to just return or set state
                return;
            }

            // Parallel fetch with scoped Org ID
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
            }

            // Calculate simple stats
            setStats({
                totalRevenue: (fetchedApts || []).length * 50,
                totalBookings: (fetchedApts || []).length,
                activeStaff: (fetchedStaff || []).length
            });
        } catch (error) {
            console.error("Dashboard Data Load Error:", error);
            // safe error object handling
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const handleAppointmentClick = (apt: Appointment) => {
        setSelectedAppointment(apt);
        setIsRescheduleModalOpen(true);
    };

    const onReschedule = async (id: string, newDate: string, newTime: string) => {
        await updateAppointment(id, { date: newDate, timeSlot: newTime });
        await loadDashboardData();
    };

    const onCancel = async (id: string) => {
        await cancelAppointment(id);
        await loadDashboardData();
    };

    const [createSelection, setCreateSelection] = useState<{ date: Date | null, time: string | null }>({ date: null, time: null });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleSelectSlot = (date: Date, time: string) => {
        if (isBlockingMode) {
            setBlockSelection({ date, time });
            setIsBlockModalOpen(true);
        } else {
            setCreateSelection({ date, time });
            setIsCreateModalOpen(true);
        }
    };

    const handleCreateConfirm = async (data: {
        serviceId: string;
        staffId: string;
        clientName: string;
        clientEmail: string;
        date: string;
        timeSlot: string;
    }) => {
        if (!currentOrg) return;

        await createAppointment({
            serviceId: data.serviceId,
            staffId: data.staffId,
            clientId: 'admin-created',
            clientName: data.clientName,
            clientEmail: data.clientEmail,
            date: data.date,
            timeSlot: data.timeSlot
        }, currentOrg.id);

        await loadDashboardData();
    };


    const onConfirmBlock = async (staffId: string, note: string) => {
        if (!currentOrg || !blockSelection.date || !blockSelection.time) return;

        const dateStr = blockSelection.date.toISOString().split('T')[0];

        await createAppointment({
            staffId,
            serviceId: services[0]?.id,
            clientName: `Blocked - ${note}`,
            clientEmail: 'blocked@internal.system',
            clientId: 'blocked@internal.system',
            date: dateStr,
            timeSlot: blockSelection.time
        }, currentOrg.id);

        setIsBlockingMode(false);
        await loadDashboardData();
    };

    const onStatusUpdate = async (id: string, newStatus: string) => {
        await updateAppointment(id, { status: newStatus });
        await loadDashboardData();
    };

    // --- DEBUG / PREVIEW MODE ---
    const [isDebugStaffView, setIsDebugStaffView] = useState(false);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('view') === 'staff') {
                setIsDebugStaffView(true);
            }
        }
    }, []);

    // --- ROLE BASED VIEW ---
    // If the user is NOT an owner/admin OR if Debug Mode is active
    if (isDebugStaffView || (userProfile && (userProfile.role !== 'owner' && userProfile.role !== 'admin' && userProfile.role !== 'ADMIN'))) {
        // Find matching staff record by email
        const matchedStaff = currentUser?.email ? staff.find(s => s.email === currentUser.email) : null;

        // In Debug Mode, if no matching staff for the Admin's email, use the first staff member to show data
        const displayStaffId = matchedStaff?.id || (isDebugStaffView ? staff[0]?.id : undefined);

        return (
            <BarberDashboard
                appointments={appointments}
                currentUser={currentUser || { id: 'loading' }}
                currentStaffId={displayStaffId}
                services={services}
                staff={staff}
                availability={availability} // Pass availability data
                businessHours={currentOrg?.business_hours}
                onStatusUpdate={onStatusUpdate}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Desktop Sidebar (Fixed) */}
            <AdminSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                currentOrg={currentOrg}
            />

            {/* Main Content Area (Mobile: Fixed Height App Shell, Desktop: Scrollable) */}
            <main className="lg:ml-64 lg:min-h-screen h-[100dvh] flex flex-col lg:block">
                <div className={`flex-1 flex flex-col lg:overflow-visible lg:space-y-6 lg:p-8 ${activeTab === 'operations' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                    {/* Mobile Header (Fixed Top) */}
                    <div className="lg:hidden flex-shrink-0 flex justify-between items-center h-16 gap-4 px-4 pt-2 mb-2">
                        {/* Left Side: Logo & Branding */}
                        <div className="flex items-center gap-3 z-10 flex-1 min-w-0">
                            {currentOrg?.logo_url ? (
                                <img src={currentOrg.logo_url} alt="Logo" className="w-10 h-10 flex-shrink-0 object-contain" />
                            ) : (
                                <img src="/icon-180.png" alt="Reelin Logo" className="w-10 h-10 flex-shrink-0 object-contain rounded-lg" />
                            )}
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none truncate">
                                {currentOrg?.name || 'Reelin Bookings'}
                            </h1>
                        </div>

                        {/* Center: Navigation (Mobile Bottom Bar handled internally by AdminNav) */}
                        <AdminNav
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            currentOrg={currentOrg}
                        />
                    </div>

                    {/* OPERATIONS (New Home) */}
                    {
                        activeTab === 'operations' && (
                            <div className="flex-1 flex flex-col min-h-0 lg:block lg:min-h-auto animate-in fade-in duration-300">
                                {/* Hero Operations Layout - Dense Stacked */}
                                <div className="flex flex-col gap-4 h-full lg:h-auto">
                                    {/* Today's Pulse (Top) */}
                                    <div className="w-full hidden lg:block">
                                        <TodayPanel
                                            appointments={appointments}
                                            staff={staff}
                                            services={services}
                                            availability={availability}
                                            businessHours={currentOrg?.business_hours}
                                            onAppointmentClick={handleAppointmentClick}
                                        />
                                    </div>

                                    {/* Weekly Calendar (Bottom) */}
                                    <div className="w-full h-full lg:h-auto bg-white lg:rounded-xl lg:border border-gray-200 lg:shadow-sm overflow-hidden flex flex-col">
                                        <WeeklyCalendar
                                            appointments={appointments.filter(a => selectedStaffId === 'ALL' || a.staffId === selectedStaffId)}
                                            staff={staff}
                                            services={services}
                                            availability={availability}
                                            businessHours={currentOrg?.business_hours}
                                            isBlockingMode={isBlockingMode}
                                            onSelectSlot={handleSelectSlot}
                                            onAppointmentClick={handleAppointmentClick}
                                        />
                                    </div>
                                </div>

                                {/* FLOATING ACTION BUTTON (Mobile Only) */}
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="lg:hidden fixed bottom-24 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center z-40 hover:bg-blue-700 active:scale-95 transition-all"
                                >
                                    <Plus className="w-8 h-8" />
                                </button>
                            </div>
                        )
                    }

                    {
                        activeTab === 'services' && currentOrg && (
                            <div className="animate-in fade-in duration-300">
                                <ServiceManager
                                    services={services}
                                    orgId={currentOrg.id}
                                    onRefresh={loadDashboardData}
                                />
                            </div>
                        )
                    }

                    {
                        activeTab === 'team' && currentOrg && (
                            <div className="animate-in fade-in duration-300">
                                <StaffManager
                                    staff={staff}
                                    services={services}
                                    orgId={currentOrg.id}
                                    onRefresh={loadDashboardData}
                                />
                            </div>
                        )
                    }

                    {
                        activeTab === 'analytics' && (
                            <AnalyticsView
                                appointments={appointments}
                                services={services}
                                staff={staff}
                            />
                        )
                    }

                    {
                        activeTab === 'profile' && currentUser && (
                            <div className="animate-in fade-in duration-300">
                                <ProfileManager
                                    user={currentUser}
                                    profile={userProfile}
                                    onUpdate={loadDashboardData}
                                    org={currentOrg}
                                    onUpdateOrg={(updated) => setCurrentOrg(updated)}
                                    services={services}
                                    staff={staff}
                                    onRefresh={loadDashboardData}
                                />
                            </div>
                        )
                    }



                    <RescheduleModal
                        isOpen={!!selectedAppointment}
                        appointment={selectedAppointment}
                        onClose={() => setSelectedAppointment(null)}
                        onReschedule={onReschedule}
                        onCancel={onCancel}
                        onRestore={async (id) => {
                            await uncancelAppointment(id);
                            setSelectedAppointment(null);
                            loadDashboardData();
                        }}
                        onArchive={async (id) => {
                            await archiveAppointment(id);
                            await loadDashboardData();
                            setSelectedAppointment(null);
                        }}
                        services={services}
                        slotInterval={currentOrg?.slot_interval}
                        businessHours={currentOrg?.business_hours}
                    />

                    <BlockModal
                        isOpen={isBlockModalOpen}
                        date={blockSelection.date}
                        time={blockSelection.time}
                        staff={staff}
                        onClose={() => setIsBlockModalOpen(false)}
                        onConfirm={onConfirmBlock}
                    />

                    <CreateAppointmentModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onConfirm={handleCreateConfirm}
                        defaultDate={createSelection.date}
                        defaultTime={createSelection.time}
                        services={services}
                        staff={staff}
                        appointments={appointments}
                        availability={availability}
                        slotInterval={currentOrg?.slot_interval}
                        businessHours={currentOrg?.business_hours}
                    />
                </div>
            </main >
        </div >
    );
}
