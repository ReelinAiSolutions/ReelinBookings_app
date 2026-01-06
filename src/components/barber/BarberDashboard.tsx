'use client';

import React, { useState, useEffect } from 'react';
import { Appointment, Service, User, Staff, Organization, Availability } from '@/types';
import { format } from 'date-fns';
import {
    Clock,
    CheckCircle2,
    Briefcase,
    User as UserIcon,
    Calendar as CalendarIcon,
    BarChart3,
    ChevronDown,
    Users,
    TrendingUp,
    Layout,
    Globe,
    Scissors,
    DollarSign,
    Plus,
    Settings,
    Contact
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import StaffStats from './BarberStats';
import StaffSettings from './StaffSettings';
import StaffManager from '@/components/admin/StaffManager';
import ClientManager from '@/components/admin/ClientManager';
import WeeklyCalendar from '../admin/WeeklyCalendar';
import StaffSidebar from './StaffSidebar';
import RescheduleModal from '../admin/RescheduleModal';
import CreateAppointmentModal from '../admin/CreateAppointmentModal';
import { updateAppointment, cancelAppointment, uncancelAppointment, archiveAppointment, createAppointment } from '@/services/dataService';
import BrandingInjector from '../BrandingInjector';

interface StaffDashboardProps {
    appointments: Appointment[];
    currentUser: User;
    userProfile?: any; // Added userProfile
    currentStaffId?: string;
    services: Service[];
    staff?: Staff[];
    holidays?: string[];
    availability?: Availability[];
    businessHours?: Organization['business_hours'];
    currentOrg?: Organization | null;
    onStatusUpdate: (appointmentId: string, status: string) => Promise<void>;
    onRefresh?: () => Promise<void>;
}


export default function StaffDashboard({
    appointments,
    currentUser,
    userProfile,
    currentStaffId,
    services,
    staff = [],
    availability = [],
    businessHours,
    currentOrg,
    onStatusUpdate,
    onRefresh
}: StaffDashboardProps) {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule' | 'performance' | 'settings' | 'team' | 'clients'>('schedule');

    // Deep Linking
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam && ['dashboard', 'schedule', 'performance', 'settings', 'team', 'clients'].includes(tabParam)) {
                setActiveTab(tabParam as any);
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (url.searchParams.get('tab') !== activeTab) {
                url.searchParams.set('tab', activeTab);
                window.history.replaceState({}, '', url);
            }
        }
    }, [activeTab]);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createSelection, setCreateSelection] = useState<{ date: Date | null, time: string | null }>({ date: null, time: null });

    const handleSelectSlot = (date: Date, time: string) => {
        setCreateSelection({ date, time });
        setIsCreateModalOpen(true);
    };

    const handleCreateConfirm = async (data: any) => {
        if (!currentOrg) return;
        const created = await createAppointment({
            ...data,
            clientId: 'staff-created'
        }, currentOrg.id);

        // Notify Staff (if not a block)
        if (data.clientEmail !== 'blocked@internal' && data.staffId) {
            try {
                const targetStaff = staff.find(s => s.id === data.staffId);
                const recipientId = targetStaff?.userId || data.staffId;

                await fetch('/api/push-notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: recipientId,
                        title: 'New Booking (Manual) 📅',
                        body: `${data.clientName} booked slot for ${data.timeSlot}`,
                        url: `/staff?tab=schedule&appointmentId=${created.id}`,
                        type: 'new_booking'
                    })
                });
            } catch (e) {
                console.error("Push failed", e);
            }
        }

        if (onRefresh) await onRefresh();
        setIsCreateModalOpen(false);
    };

    const handleAppointmentClick = (apt: Appointment) => {
        setSelectedAppointment(apt);
    };

    const onReschedule = async (
        id: string,
        date: string,
        time: string,
        staffId: string,
        options: {
            notes?: string;
            durationMinutes?: number;
            bufferMinutes?: number;
            clientName?: string;
            clientEmail?: string;
            clientPhone?: string;
        }
    ) => {
        await updateAppointment(id, {
            date,
            timeSlot: time,
            staffId,
            notes: options.notes,
            clientName: options.clientName,
            clientEmail: options.clientEmail,
            clientPhone: options.clientPhone
        });

        // Notify Staff
        try {
            const targetStaff = staff.find(s => s.id === staffId);
            const recipientId = targetStaff?.userId || staffId;
            const originalAppointment = appointments.find(a => a.id === id);

            await fetch('/api/push-notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: recipientId,
                    title: 'Appointment Moved! 🕒',
                    body: `${originalAppointment?.clientName || 'Appt'} moved to ${date} at ${time}`,
                    url: '/staff?tab=schedule',
                    type: 'reschedule'
                })
            });
        } catch (e) {
            console.error("Reschedule push failed", e);
        }

        if (onRefresh) await onRefresh();
    };

    const handleCancel = async (id: string) => {
        // Notify Staff BEFORE updating status if we need data
        const originalAppointment = appointments.find(a => a.id === id);

        await cancelAppointment(id);

        // Notify Staff
        if (originalAppointment) {
            try {
                const targetStaff = staff.find(s => s.id === originalAppointment.staffId);
                const recipientId = targetStaff?.userId || originalAppointment.staffId;

                await fetch('/api/push-notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: recipientId,
                        title: 'Appointment Cancelled ❌',
                        body: `${originalAppointment.clientName} cancelled for ${originalAppointment.date} at ${originalAppointment.timeSlot}`,
                        url: '/staff?tab=schedule',
                        type: 'cancellation'
                    })
                });
            } catch (e) {
                console.error("Cancel push failed", e);
            }
        }

        if (onRefresh) await onRefresh();
    };

    const handleRestore = async (id: string) => {
        await uncancelAppointment(id);
        if (onRefresh) await onRefresh();
    };

    const handleArchive = async (id: string) => {
        await archiveAppointment(id);
        if (onRefresh) await onRefresh();
        setSelectedAppointment(null);
    };




    // Dynamic Branding Style - Prioritize staff personal color
    const displayColor = userProfile?.settings?.admin_color || currentOrg?.primary_color || '#a855f7';

    const brandingStyle = {
        '--brand-primary': displayColor,
        '--primary-color': displayColor, // Added primary-color for consistency with admin
    } as React.CSSProperties;

    const effectiveStaffId = currentStaffId || 'NOT_FOUND';

    return (
        <div
            className="min-h-screen bg-white dark:bg-black flex flex-col lg:block overflow-x-hidden relative"
            style={brandingStyle}
        >
            <BrandingInjector primaryColor={displayColor} />
            {/* Desktop Sidebar (Fixed) */}
            <StaffSidebar
                currentTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as any)}
                organization={currentOrg || null}
                staff={currentUser}
            />

            {/* Main Content Area */}
            <main className={`lg:ml-72 min-h-screen ${activeTab === 'schedule' ? 'h-[100dvh] overflow-hidden fixed inset-0 lg:relative' : 'pb-24'}`} style={activeTab === 'schedule' ? { overscrollBehavior: 'none' } : {}}>

                {/* Global Brand Glow (Admin Style) */}
                <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none -z-10" />

                {/* Content Container - Adjusted for missing header */}
                <div className={`min-h-0 ${activeTab === 'schedule' ? 'lg:flex-1 lg:flex lg:flex-col p-0 h-full' : 'lg:px-10 px-4 py-8 lg:py-12 space-y-12'}`}>


                    {activeTab === 'schedule' && (
                        <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
                            <div className="flex-1 flex flex-col h-full overflow-hidden">
                                <WeeklyCalendar
                                    appointments={appointments.filter(a => a.status !== 'CANCELLED')}
                                    staff={staff}
                                    services={services}
                                    availability={availability}
                                    businessHours={currentOrg?.business_hours}
                                    holidays={currentOrg?.settings?.scheduling?.holidays}
                                    onSelectSlot={handleSelectSlot}
                                    onAppointmentClick={handleAppointmentClick}
                                    colorMode={currentOrg?.settings?.color_mode || 'staff'}
                                    showStaffFilter={true}

                                    currentStaffId={effectiveStaffId}
                                    userThemeColor={displayColor} // Inject Personal Theme
                                />

                            </div>

                            {/* Mobile FAB for new appointment */}
                            {/* Mobile FAB removed as per user request (redundant with header button) */}
                        </div>
                    )}

                    {(activeTab === 'performance' || activeTab === 'dashboard') && (
                        <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <StaffStats
                                appointments={appointments}
                                services={services}
                                currentStaffId={effectiveStaffId}
                            />
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="h-full animate-in fade-in duration-300">
                            <StaffManager
                                staff={staff}
                                services={services}
                                orgId={currentOrg?.id || ''}
                                readOnly={true}
                            />
                        </div>
                    )}

                    {activeTab === 'clients' && (
                        <div className="h-full animate-in fade-in duration-300">
                            <ClientManager
                                appointments={appointments.filter(apt => apt.staffId === currentStaffId)}
                                services={services}
                                isStaffView={true}
                            />
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto">
                            <StaffSettings
                                currentUser={currentUser}
                                onRefresh={onRefresh}
                                initialSettings={userProfile?.settings}
                            />
                        </div>
                    )}

                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-black backdrop-blur-lg border-t border-gray-100 dark:border-white/10 flex justify-around items-center z-50 px-6 pb-2 safe-area-pb">
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'schedule' ? 'text-primary-600 dark:text-primary-400 scale-110' : 'text-gray-400 dark:text-gray-500'}`}
                >
                    <CalendarIcon className={`w-6 h-6 ${activeTab === 'schedule' ? 'fill-primary-600/10' : ''}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Schedule</span>
                </button>
                <button
                    onClick={() => setActiveTab('performance')}
                    className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'performance' ? 'text-primary-600 dark:text-primary-400 scale-110' : 'text-gray-400 dark:text-gray-500'}`}
                >
                    <BarChart3 className={`w-6 h-6 ${activeTab === 'performance' ? 'fill-primary-600/10' : ''}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Stats</span>
                </button>
                <button
                    onClick={() => setActiveTab('team')}
                    className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'team' ? 'text-primary-600 dark:text-primary-400 scale-110' : 'text-gray-400 dark:text-gray-500'}`}
                >
                    <Users className={`w-6 h-6 ${activeTab === 'team' ? 'fill-primary-600/10' : ''}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Team</span>
                </button>
                <button
                    onClick={() => setActiveTab('clients')}
                    className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'clients' ? 'text-primary-600 dark:text-primary-400 scale-110' : 'text-gray-400 dark:text-gray-500'}`}
                >
                    <Contact className={`w-6 h-6 ${activeTab === 'clients' ? 'fill-primary-600/10' : ''}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Clients</span>
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'settings' ? 'text-primary-600 dark:text-primary-400 scale-110' : 'text-gray-400 dark:text-gray-500'}`}
                >
                    <Settings className={`w-6 h-6 ${activeTab === 'settings' ? 'fill-primary-600/10' : ''}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Settings</span>
                </button>
            </div>

            <RescheduleModal
                isOpen={!!selectedAppointment}
                appointment={selectedAppointment}
                onClose={() => setSelectedAppointment(null)}
                onReschedule={onReschedule}
                onCancel={handleCancel}
                onRestore={handleRestore}
                onArchive={handleArchive}
                services={services}
                staff={staff}
                slotInterval={currentOrg?.slot_interval}
                businessHours={currentOrg?.business_hours}
                holidays={currentOrg?.settings?.scheduling?.holidays}
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
                holidays={currentOrg?.settings?.scheduling?.holidays}
            />
        </div>
    );
}
