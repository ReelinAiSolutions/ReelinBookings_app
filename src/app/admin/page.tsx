import { createClient } from '@/lib/supabase';
'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DashboardStats from '@/components/admin/DashboardStats';
import AdminSidebar from '@/components/admin/AdminSidebar';
import DashboardCharts from '@/components/admin/DashboardCharts';
import AppointmentList from '@/components/admin/AppointmentList';
import ServiceManager from '@/components/admin/ServiceManager';
import StaffManager from '@/components/admin/StaffManager';
import ClientManager from '@/components/admin/ClientManager';
import AnalyticsView from '@/components/admin/AnalyticsView';
import PerformanceView from '@/components/admin/PerformanceView';
import WeeklyCalendar from '@/components/admin/WeeklyCalendar';
import TodayPanel from '@/components/admin/TodayPanel';
import RescheduleModal from '@/components/admin/RescheduleModal';
import BlockModal from '@/components/admin/BlockModal';
import CreateAppointmentModal from '@/components/admin/CreateAppointmentModal';
import StaffDashboard from '@/components/barber/BarberDashboard';
import ProfileManager from '@/components/admin/ProfileManager'; // Restored import
import SettingsManager from '@/components/admin/SettingsManager'; // Added Settings Manager
import AdminNav from '@/components/admin/AdminNav'; // New import
import BrandingInjector from '@/components/BrandingInjector';
import { useRouter } from 'next/navigation';
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


const AmbientBackground = () => (
    <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes mashDrift {
            0% { background-position: 0% 50%; opacity: 0.7; }
            50% { background-position: 100% 50%; opacity: 1; }
            100% { background-position: 0% 50%; opacity: 0.7; }
        }
        .ambient-mesh {
            background: radial-gradient(circle at 10% 20%, rgba(0, 122, 255, 0.08) 0%, transparent 40%),
                        radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.08) 0%, transparent 40%),
                        radial-gradient(circle at 50% 50%, rgba(0, 122, 255, 0.05) 0%, transparent 100%);
            background-size: 200% 200%;
            animation: mashDrift 15s infinite ease-in-out;
        }
    `}} />
);

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
    const [activeTab, setActiveTab] = useState<'operations' | 'analytics' | 'settings' | 'profile' | 'invites' | 'services' | 'team' | 'clients'>('operations');
    const [appointments, setAppointments] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalRevenue: 0, totalBookings: 0, activeStaff: 0 });
    const [services, setServices] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [availability, setAvailability] = useState<any[]>([]); // New state
    const [chartData, setChartData] = useState<any[]>(MOCK_STATS);
    const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null); // New state
    const [userProfile, setUserProfile] = useState<any>(null); // New state
    const router = useRouter();

    const supabase = createClient();

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

            // 1. Fetch Core Data (Parallel)
            // We use Promise.allSettled where available, or just separate critical from non-critical.
            // Critical: Appointments, Services, Staff (Operations)
            // Non-Critical: Org Metadata (if it fails, we just show default branding)

            // Core Fetch
            const [fetchedApts, fetchedServices, fetchedStaff, fetchedAvailability] = await Promise.all([
                getAppointments(orgId),
                getServices(orgId),
                getStaff(orgId),
                getAllAvailability(orgId)
            ]);

            setAppointments(fetchedApts || []);
            setServices(fetchedServices || []);
            setStaff(fetchedStaff || []);
            setAvailability(fetchedAvailability || []);

            // 2. Fetch Metadata (Parallel but isolated catch)
            try {
                const [fetchedOrg, fetchedProfile] = await Promise.all([
                    getOrganizationById(orgId),
                    getUserProfile()
                ]);

                setCurrentOrg(fetchedOrg as Organization);

                if (fetchedProfile) {
                    setCurrentUser(fetchedProfile.user);
                    setUserProfile(fetchedProfile.profile);

                    // --- SMART REDIRECT FOR STAFF ---
                    const role = fetchedProfile.profile.role?.toLowerCase();
                    if (role && role !== 'owner' && role !== 'admin') {
                        const params = new URLSearchParams(window.location.search);
                        router.push(`/staff?${params.toString()}`);
                        return;
                    }
                }
            } catch (metaError) {
                console.error("Metadata Load Error (Non-Critical):", metaError);
                // We continue, so the dashboard still works even if org details fail
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

        // Initial Tab Sync
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam && ['operations', 'analytics', 'settings', 'profile', 'invites', 'services', 'team', 'clients'].includes(tabParam)) {
                setActiveTab(tabParam as any);
            }
        }
    }, []);

    // Sync Tab to URL
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (url.searchParams.get('tab') !== activeTab) {
                url.searchParams.set('tab', activeTab);
                window.history.replaceState({}, '', url);
            }
        }
    }, [activeTab]);

    useEffect(() => {
        if (!currentOrg?.id) return;

        const channel = supabase
            .channel('admin-dashboard-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'appointments',
                    filter: `org_id=eq.${currentOrg.id}`
                },
                () => {
                    loadDashboardData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentOrg?.id]);

    const handleAppointmentClick = (apt: Appointment) => {
        setSelectedAppointment(apt);
        setIsRescheduleModalOpen(true);
    };

    const onReschedule = async (
        id: string,
        newDate: string,
        newTime: string,
        newStaffId: string,
        options: { notes?: string; durationMinutes?: number; bufferMinutes?: number }
    ) => {
        await updateAppointment(id, {
            date: newDate,
            timeSlot: newTime,
            staffId: newStaffId,
            notes: options.notes
        });
        await loadDashboardData();
    };

    const onCancel = async (id: string) => {
        await cancelAppointment(id);
        await loadDashboardData();
    };

    // Drag & Drop Handler
    const handleAppointmentDrop = async (apt: Appointment, newDate: Date, newTime: string, newStaffId?: string) => {
        const dateStr = format(newDate, 'yyyy-MM-dd');
        await updateAppointment(apt.id, {
            date: dateStr,
            timeSlot: newTime,
            staffId: newStaffId || apt.staffId
        });
        await loadDashboardData();
    };

    const [createSelection, setCreateSelection] = useState<{ date: Date | null, time: string | null, staffId: string | null }>({ date: null, time: null, staffId: null });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleSelectSlot = (date: Date, time: string, staffId?: string) => {
        if (isBlockingMode) {
            setBlockSelection({ date, time });
            setIsBlockModalOpen(true);
        } else {
            setCreateSelection({ date, time, staffId: staffId || null });
            setIsCreateModalOpen(true);
        }
    };

    const handleCreateConfirm = async (data: {
        serviceId: string;
        staffId: string;
        clientName: string;
        clientEmail: string;
        clientPhone?: string;
        date: string;
        timeSlot: string;
        notes?: string;
        durationMinutes?: number;
        bufferMinutes?: number;
    }) => {
        if (!currentOrg) return;

        await createAppointment({
            serviceId: data.serviceId,
            staffId: data.staffId,
            clientId: 'admin-created',
            clientName: data.clientName,
            clientEmail: data.clientEmail,
            clientPhone: data.clientPhone,
            date: data.date,
            timeSlot: data.timeSlot,
            notes: data.notes,
            durationMinutes: data.durationMinutes,
            bufferMinutes: data.bufferMinutes
        }, currentOrg.id);

        await loadDashboardData();
    };


    const onConfirmBlock = async (staffId: string, note: string, durationMinutes: number) => {
        if (!currentOrg || !blockSelection.date || !blockSelection.time) return;

        const dateStr = blockSelection.date.toISOString().split('T')[0];

        await createAppointment({
            staffId,
            serviceId: services[0]?.id,
            clientName: `Blocked - ${note}`,
            clientEmail: 'blocked@internal.system',
            clientId: 'blocked@internal.system',
            date: dateStr,
            timeSlot: blockSelection.time,
            durationMinutes: durationMinutes
        }, currentOrg.id);

        setIsBlockingMode(false);
        await loadDashboardData();
    };

    const onStatusUpdate = async (id: string, newStatus: string) => {
        await updateAppointment(id, { status: newStatus as any });
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
    // Instead of a hard redirect (which causes React errors when done during render),
    // we show a secure overlay if the role doesn't match.
    const isUnauthorized = userProfile &&
        userProfile.role !== 'owner' &&
        userProfile.role !== 'admin' &&
        userProfile.role !== 'ADMIN';

    if (isUnauthorized) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
                <div className="flex flex-col items-center gap-6 animate-pulse">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                        <Lock className="w-8 h-8 text-primary-400" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-black mb-2">Redirecting to Team Portal...</h2>
                        <p className="text-gray-400 font-medium">Please wait while we secure your session.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Dynamic Branding Style
    const brandingStyle = currentOrg?.primary_color ? {
        '--brand-primary': currentOrg.primary_color,
    } as React.CSSProperties : {};

    return (
        <div
            className="min-h-screen bg-white relative overflow-hidden flex"
            style={brandingStyle}
        >
            <AmbientBackground />
            <div className="absolute inset-0 ambient-mesh pointer-events-none fixed z-0" />
            <BrandingInjector primaryColor={currentOrg?.primary_color} />
            {/* Desktop Sidebar (Fixed) */}
            <AdminSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                currentOrg={currentOrg}
            />

            {/* Main Content Area (Mobile: Scrollable Page, Desktop: Fixed Height App Shell) */}
            {/* Main Content Area (Mobile: Scrollable Page, Desktop: Fixed Height App Shell) */}
            <main className={`w-full lg:ml-64 lg:min-h-screen ${activeTab === 'operations' ? 'flex flex-col h-[100dvh] overflow-hidden fixed inset-0 lg:relative' : 'block min-h-screen'}`} style={activeTab === 'operations' ? { overscrollBehavior: 'none' } : {}}>
                <div className={`${activeTab === 'operations' ? 'flex-1 flex flex-col h-full overflow-hidden p-0' : 'p-4 pb-24 lg:p-10 space-y-6'}`}>
                    {/* Mobile Header (Only for non-operations tabs) */}



                    {/* OPERATIONS (New Home) */}
                    {
                        activeTab === 'operations' && (
                            <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
                                {/* Design Labs Calendar - Mobile & Desktop */}
                                <div className="flex-1 flex flex-col h-full overflow-hidden">
                                    <WeeklyCalendar
                                        appointments={appointments.filter(a => selectedStaffId === 'ALL' || a.staffId === selectedStaffId)}
                                        staff={staff}
                                        services={services}
                                        businessHours={currentOrg?.business_hours}
                                        onSelectSlot={handleSelectSlot}
                                        onAppointmentClick={handleAppointmentClick}
                                        onAppointmentUpdate={handleAppointmentDrop}
                                        currentStaffId={(() => {
                                            if (userProfile?.profile?.role === 'admin') return 'ALL';
                                            const staffMember = staff.find(s => s.email === userProfile?.user?.email);
                                            return staffMember?.id || 'ALL';
                                        })()}
                                    />
                                </div>
                            </div>
                        )
                    }





                    {
                        activeTab === 'services' && (
                            <div className="animate-in fade-in duration-300">
                                <ServiceManager
                                    services={services}
                                    orgId={currentOrg?.id || ''}
                                    onRefresh={loadDashboardData}
                                />
                            </div>
                        )
                    }

                    {
                        activeTab === 'team' && (
                            <div className="animate-in fade-in duration-300">
                                <StaffManager
                                    staff={staff}
                                    services={services}
                                    orgId={currentOrg?.id || ''}
                                    onRefresh={loadDashboardData}
                                />
                            </div>
                        )
                    }

                    {activeTab === 'clients' && (
                        <ClientManager
                            appointments={appointments}
                            services={services}
                            isStaffView={false}
                        />
                    )}

                    {
                        activeTab === 'analytics' && (
                            <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
                                <PerformanceView
                                    appointments={appointments}
                                    services={services}
                                    staff={staff}
                                />
                            </div>
                        )
                    }

                    {
                        activeTab === 'profile' && currentUser && (
                            <div className="animate-in fade-in duration-300">
                                <ProfileManager
                                    user={currentUser}
                                    profile={userProfile}
                                    onUpdate={loadDashboardData}
                                />
                            </div>
                        )
                    }

                    {
                        activeTab === 'settings' && currentOrg && (
                            <div className="animate-in fade-in duration-300">
                                <SettingsManager
                                    org={currentOrg}
                                    onUpdate={(updated) => {
                                        setCurrentOrg(updated);
                                        loadDashboardData();
                                    }}
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
                        staff={staff}
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
                        preselectedStaffId={createSelection.staffId || undefined}
                        slotInterval={currentOrg?.slot_interval}
                        businessHours={currentOrg?.business_hours}
                    />
                </div>
            </main >

            <AdminNav
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                currentOrg={currentOrg}
            />
        </div >
    );
}
