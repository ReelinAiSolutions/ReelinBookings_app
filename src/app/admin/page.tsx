'use client';

import React, { useState, useEffect } from 'react';
import DashboardStats from '@/components/admin/DashboardStats';
import AdminSidebar from '@/components/admin/AdminSidebar';
import DashboardCharts from '@/components/admin/DashboardCharts';
import AppointmentList from '@/components/admin/AppointmentList';
import ServiceManager from '@/components/admin/ServiceManager';
import StaffManager from '@/components/admin/StaffManager';
import AnalyticsView from '@/components/admin/AnalyticsView';
import PerformanceView from '@/components/admin/PerformanceView';
import WeeklyCalendar from '@/components/admin/WeeklyCalendar';
import TodayPanel from '@/components/admin/TodayPanel';
import RescheduleModal from '@/components/admin/RescheduleModal';
import BlockModal from '@/components/admin/BlockModal';
import CreateAppointmentModal from '@/components/admin/CreateAppointmentModal';
import StaffDashboard from '@/components/barber/BarberDashboard';
import ProfileManager from '@/components/admin/ProfileManager'; // Restored import
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
    const [activeTab, setActiveTab] = useState<'operations' | 'analytics' | 'settings' | 'profile' | 'invites' | 'services' | 'team'>('operations');
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
    }, []);

    const handleAppointmentClick = (apt: Appointment) => {
        setSelectedAppointment(apt);
        setIsRescheduleModalOpen(true);
    };

    const onReschedule = async (id: string, newDate: string, newTime: string, newStaffId: string) => {
        await updateAppointment(id, { date: newDate, timeSlot: newTime, staffId: newStaffId });
        await loadDashboardData();
    };

    const onCancel = async (id: string) => {
        await cancelAppointment(id);
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
    // Instead of a hard redirect (which causes React errors when done during render),
    // we show a secure overlay if the role doesn't match.
    const isUnauthorized = userProfile &&
        userProfile.role !== 'owner' &&
        userProfile.role !== 'admin' &&
        userProfile.role !== 'ADMIN';

    if (isUnauthorized) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-white overflow-hidden relative">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative z-10 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary-500/20 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
                        <Lock className="w-10 h-10 text-primary-400" />
                    </div>

                    <h2 className="text-3xl font-black mb-4 tracking-tight">Access Restricted</h2>
                    <p className="text-gray-400 font-medium mb-10 leading-relaxed">
                        You are currently logged in as <span className="text-white font-bold">{currentUser?.email}</span>.
                        This account does not have Admin permissions.
                    </p>

                    <div className="grid gap-4">
                        <Link
                            href="/staff"
                            className="bg-white text-gray-900 h-14 rounded-2xl flex items-center justify-center font-black text-sm uppercase tracking-widest hover:bg-primary-50 transition-all shadow-xl active:scale-95"
                        >
                            Go to Team Portal
                        </Link>
                        <button
                            onClick={async () => {
                                const { createClient } = await import('@/lib/supabase');
                                const supabase = createClient();
                                await supabase.auth.signOut();
                                window.location.href = '/login';
                            }}
                            className="h-14 rounded-2xl border border-white/10 text-white font-black text-sm uppercase tracking-widest hover:bg-white/5 transition-all active:scale-95"
                        >
                            Sign out of this session
                        </button>
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
            className="min-h-screen bg-[#F8F9FD] relative overflow-hidden flex"
            style={brandingStyle}
        >
            <AmbientBackground />
            <div className="absolute inset-0 ambient-mesh pointer-events-none" />
            <BrandingInjector primaryColor={currentOrg?.primary_color} />
            {/* Desktop Sidebar (Fixed) */}
            <AdminSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                currentOrg={currentOrg}
            />

            {/* Main Content Area (Mobile: Scrollable Page, Desktop: Fixed Height App Shell) */}
            <main className={`lg:ml-64 lg:min-h-screen ${activeTab === 'operations' ? 'flex flex-col min-h-screen lg:h-[100dvh]' : 'block min-h-screen'}`}>
                <div className={`${activeTab === 'operations' ? 'flex-1 flex flex-col h-full lg:p-10 lg:overflow-hidden' : 'p-4 pb-24 lg:p-10 space-y-6'}`}>
                    {/* Mobile Header (Only for non-operations tabs) */}
                    {activeTab !== 'operations' && (
                        <div className="lg:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-4 h-16 flex items-center justify-between -mx-4 -mt-4 mb-4 transition-all duration-300">
                            {/* Left: Organization Logo & Name */}
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-1.5 bg-white/50 rounded-xl shadow-sm border border-gray-100/50 backdrop-blur-sm">
                                    {currentOrg?.logo_url ? (
                                        <img src={currentOrg.logo_url} alt="Logo" className="w-8 h-8 flex-shrink-0 object-contain" />
                                    ) : (
                                        <img src="/icon-180.png" alt="Reelin Logo" className="w-8 h-8 flex-shrink-0 object-contain rounded-md" />
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0 justify-center">
                                    <h1 className="text-base font-black text-gray-900 tracking-tight leading-none truncate">
                                        {currentOrg?.name || 'Reelin Bookings'}
                                    </h1>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-1">Management Hub</span>
                                </div>
                            </div>
                        </div>
                    )}


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
                                        availability={availability}
                                        businessHours={currentOrg?.business_hours}
                                        isBlockingMode={isBlockingMode}
                                        onSelectSlot={handleSelectSlot}
                                        onAppointmentClick={handleAppointmentClick}
                                        colorMode={currentOrg?.settings?.color_mode || 'staff'}
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
                                    org={currentOrg}
                                    onUpdateOrg={(updated) => setCurrentOrg(updated)}
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
