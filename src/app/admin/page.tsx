'use client';

import React, { useState, useEffect } from 'react';
import DashboardStats from '@/components/admin/DashboardStats';
import DashboardCharts from '@/components/admin/DashboardCharts';
import AppointmentList from '@/components/admin/AppointmentList';
import ServiceManager from '@/components/admin/ServiceManager';
import StaffManager from '@/components/admin/StaffManager';
import AIGenerator from '@/components/admin/AIGenerator';
import SettingsManager from '@/components/admin/SettingsManager';
import AnalyticsView from '@/components/admin/AnalyticsView';
import WeeklyCalendar from '@/components/admin/WeeklyCalendar';
import TodayPanel from '@/components/admin/TodayPanel';
import RescheduleModal from '@/components/admin/RescheduleModal';
import BlockModal from '@/components/admin/BlockModal';
import CreateAppointmentModal from '@/components/admin/CreateAppointmentModal';
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
    getOrganizationById
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
    const [activeTab, setActiveTab] = useState<'operations' | 'services' | 'analytics' | 'settings' | 'profile'>('operations');
    const [appointments, setAppointments] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalRevenue: 0, totalBookings: 0, activeStaff: 0 });
    const [services, setServices] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
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
        const orgId = await getCurrentUserOrganization();
        if (!orgId) {
            window.location.href = '/login?error=no_org';
            return;
        }

        // Parallel fetch with scoped Org ID
        const [fetchedApts, fetchedServices, fetchedStaff, fetchedOrg, fetchedProfile] = await Promise.all([
            getAppointments(orgId),
            getServices(orgId),
            getStaff(orgId),
            getOrganizationById(orgId),
            getUserProfile()
        ]);

        setAppointments(fetchedApts);
        setServices(fetchedServices);
        setStaff(fetchedStaff);
        setCurrentOrg(fetchedOrg as Organization);

        if (fetchedProfile) {
            setCurrentUser(fetchedProfile.user);
            setUserProfile(fetchedProfile.profile);
        }

        // Calculate simple stats
        setStats({
            totalRevenue: fetchedApts.length * 50,
            totalBookings: fetchedApts.length,
            activeStaff: fetchedStaff.length
        });
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

    return (
        <div className="space-y-6 pb-24 lg:pb-0">
            <div className="flex justify-between items-center h-16 gap-4">
                {/* Left Side: Logo & Branding */}
                <div className="flex items-center gap-4 z-10 flex-1 min-w-0">
                    {currentOrg?.logo_url && <img src={currentOrg.logo_url} alt="Logo" className="w-12 h-12 flex-shrink-0 object-contain rounded-xl border border-gray-200 bg-white" />}
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none truncate">
                            {currentOrg?.name || 'Dashboard'}
                        </h1>
                        <div className="flex items-center gap-1.5 opacity-60 mt-0.5">
                            <img src="/reelin-icon.png" className="w-3 h-3 opacity-50 hidden" />
                            <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-gray-500 truncate">Reelin Bookings</span>
                        </div>
                    </div>
                </div>

                {/* Center: Navigation */}
                <AdminNav
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    currentOrg={currentOrg}
                />

                {/* Right Side: Spacer (Empty on mobile since nav is at bottom) */}
                <div className="hidden lg:flex flex-1 justify-end min-w-0">
                    {/* Placeholder for future header items if needed */}
                </div>
            </div>

            {/* OPERATIONS (New Home) */}
            {
                activeTab === 'operations' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* OPERATIONS (New Home) */}
                        {
                            activeTab === 'operations' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    {/* Compact Mobile Header / Staff Filter */}
                                    <div className="flex items-center gap-2 overflow-x-auto p-1.5 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
                                        {/* Block Time Icon Button (Compact) */}
                                        <button
                                            onClick={() => setIsBlockingMode(!isBlockingMode)}
                                            className={`
                                    w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 shadow-sm
                                    ${isBlockingMode
                                                    ? 'bg-red-500 text-white ring-2 ring-red-500 ring-offset-2'
                                                    : 'bg-white border border-gray-200 text-gray-700'
                                                }
                                `}
                                        >
                                            {isBlockingMode ? <Lock className="w-4 h-4" /> : <Lock className="w-4 h-4 opacity-70" />}
                                        </button>

                                        <div className="w-px h-6 bg-gray-200 mx-1 flex-shrink-0"></div>

                                        <button
                                            onClick={() => setSelectedStaffId('ALL')}
                                            className={`
                                    px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border
                                    ${selectedStaffId === 'ALL'
                                                    ? 'bg-gray-900 text-white border-gray-900 shadow-md transform scale-105'
                                                    : 'bg-white border-gray-200 text-gray-600'
                                                }
                                `}
                                        >
                                            All Team
                                        </button>
                                        {staff.map(member => (
                                            <button
                                                key={member.id}
                                                onClick={() => setSelectedStaffId(member.id)}
                                                className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border
                                        ${selectedStaffId === member.id
                                                        ? 'bg-gray-900 text-white border-gray-900 shadow-md transform scale-105'
                                                        : 'bg-white border-gray-200 text-gray-600'
                                                    }
                                    `}
                                            >
                                                <span>{member.name.split(' ')[0]}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Hero Operations Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-200px)] h-auto">
                                        {/* Week View: Order 2 on Mobile */}
                                        <div className="lg:col-span-2 h-full order-2 lg:order-1 min-h-[500px]">
                                            <WeeklyCalendar
                                                appointments={appointments.filter(a => selectedStaffId === 'ALL' || a.staffId === selectedStaffId)}
                                                staff={staff}
                                                services={services}
                                                isBlockingMode={isBlockingMode}
                                                onSelectSlot={handleSelectSlot}
                                                onAppointmentClick={handleAppointmentClick}
                                            />
                                        </div>
                                        {/* Today View: Order 1 on Mobile */}
                                        <div className="h-full order-1 lg:order-2">
                                            <TodayPanel appointments={appointments} staff={staff} />
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
                    </div>
                )
            }

            {
                activeTab === 'services' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
                        {currentOrg && (
                            <>
                                <ServiceManager
                                    services={services}
                                    orgId={currentOrg.id}
                                    onRefresh={loadDashboardData}
                                />
                                <StaffManager
                                    staff={staff}
                                    services={services}
                                    orgId={currentOrg.id}
                                    onRefresh={loadDashboardData}
                                />
                            </>
                        )}
                    </div>
                )
            }

            {
                activeTab === 'analytics' && (
                    <AnalyticsView appointments={appointments} />
                )
            }

            {
                activeTab === 'settings' && currentOrg && (
                    <div className="animate-in fade-in duration-300">
                        <SettingsManager org={currentOrg} onUpdate={(updated) => {
                            setCurrentOrg(updated);
                        }} />
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

            <RescheduleModal
                isOpen={isRescheduleModalOpen}
                appointment={selectedAppointment}
                onClose={() => setIsRescheduleModalOpen(false)}
                onReschedule={onReschedule}
                onCancel={onCancel}
                services={services}
                onRestore={async (id) => {
                    await uncancelAppointment(id);
                    setIsRescheduleModalOpen(false);
                    loadDashboardData();
                }}
                onArchive={async (id) => {
                    await archiveAppointment(id);
                    setIsRescheduleModalOpen(false);
                    loadDashboardData();
                }}
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
                preselectedStaffId={selectedStaffId}
            />
        </div >
    );
}
