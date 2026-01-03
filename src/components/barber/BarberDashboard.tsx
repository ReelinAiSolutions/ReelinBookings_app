'use client';

import React, { useState, useEffect } from 'react';
import { Appointment, Service, User, Staff, Organization } from '@/types';
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
    currentStaffId?: string;
    services: Service[];
    staff?: Staff[];
    availability?: any[];
    businessHours?: Organization['business_hours'];
    currentOrg?: Organization | null;
    onStatusUpdate: (appointmentId: string, status: string) => Promise<void>;
    onRefresh?: () => Promise<void>;
}

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

export default function StaffDashboard({
    appointments,
    currentUser,
    currentStaffId,
    services,
    staff = [],
    availability = [],
    businessHours,
    currentOrg,
    onStatusUpdate,
    onRefresh
}: StaffDashboardProps) {
    const [activeTab, setActiveTab] = useState<'schedule' | 'performance' | 'settings' | 'team' | 'clients'>('schedule');

    // Deep Linking
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam && ['schedule', 'performance', 'settings', 'team', 'clients'].includes(tabParam)) {
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
        await createAppointment({
            ...data,
            clientId: 'staff-created'
        }, currentOrg.id);

        // Notify Staff (if not a block)
        if (data.clientEmail !== 'blocked@internal' && data.staffId) {
            try {
                await fetch('/api/push-notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: data.staffId,
                        title: 'New Booking (Manual) 📅',
                        body: `${data.clientName} booked slot for ${data.timeSlot}`,
                        url: '/staff?tab=schedule',
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

    const handleReschedule = async (
        id: string,
        date: string,
        time: string,
        staffId: string,
        options: { notes?: string; durationMinutes?: number; bufferMinutes?: number }
    ) => {
        await updateAppointment(id, {
            date,
            timeSlot: time,
            staffId,
            notes: options.notes
        });
        if (onRefresh) await onRefresh();
    };

    const handleCancel = async (id: string) => {
        await cancelAppointment(id);
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




    // Dynamic Branding Style
    const brandingStyle = currentOrg?.primary_color ? {
        '--brand-primary': currentOrg.primary_color,
    } as React.CSSProperties : {};

    const effectiveStaffId = currentStaffId || 'NOT_FOUND';

    return (
        <div
            className="min-h-screen bg-white flex flex-col lg:block overflow-x-hidden relative"
            style={brandingStyle}
        >
            <AmbientBackground />
            <div className="absolute inset-0 ambient-mesh pointer-events-none fixed z-0" />
            <BrandingInjector primaryColor={currentOrg?.primary_color} />
            {/* Desktop Sidebar (Fixed) */}
            <StaffSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                currentOrg={currentOrg || null}
            />

            {/* Main Content Area */}
            <main className={`lg:ml-64 lg:min-h-screen ${activeTab === 'schedule' ? 'flex flex-col h-[100dvh] overflow-hidden fixed inset-0 lg:relative' : 'block min-h-screen'}`} style={activeTab === 'schedule' ? { overscrollBehavior: 'none' } : {}}>

                {/* Content Container */}
                <div className={` min-h-0 bg-white ${activeTab === 'schedule' ? 'lg:flex-1 lg:flex lg:flex-col p-0 lg:p-2 lg:pb-2 min-h-0' : 'lg:p-6 px-4 py-4 lg:py-6 pb-24 space-y-6'}`}>


                    {activeTab === 'schedule' && (
                        <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
                            <div className="flex-1 flex flex-col h-full overflow-hidden">
                                <WeeklyCalendar
                                    appointments={appointments.filter(a => a.status !== 'CANCELLED')}
                                    staff={staff}
                                    services={services}
                                    availability={availability}
                                    businessHours={currentOrg?.business_hours}
                                    onSelectSlot={handleSelectSlot}
                                    onAppointmentClick={handleAppointmentClick}
                                    colorMode={currentOrg?.settings?.color_mode || 'staff'}
                                    showStaffFilter={true}
                                    currentStaffId={effectiveStaffId}
                                />
                            </div>

                            {/* Mobile FAB for new appointment */}
                            {/* Mobile FAB removed as per user request (redundant with header button) */}
                        </div>
                    )}

                    {activeTab === 'performance' && (
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
                                onUpdate={() => onRefresh?.()}
                            />
                        </div>
                    )}

                    <RescheduleModal
                        isOpen={!!selectedAppointment}
                        appointment={selectedAppointment}
                        onClose={() => setSelectedAppointment(null)}
                        onReschedule={handleReschedule}
                        onCancel={handleCancel}
                        onRestore={handleRestore}
                        onArchive={handleArchive}
                        services={services}
                        staff={staff}
                        slotInterval={currentOrg?.slot_interval}
                        businessHours={currentOrg?.business_hours}
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

                {/* Mobile Navigation */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-lg border-t border-gray-100 flex justify-around items-center z-50 px-6 pb-2 safe-area-pb">
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'schedule' ? 'text-[#4F46E5] scale-110' : 'text-gray-400'}`}
                    >
                        <CalendarIcon className={`w-6 h-6 ${activeTab === 'schedule' ? 'fill-[#4F46E5]/10' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Schedule</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'performance' ? 'text-[#4F46E5] scale-110' : 'text-gray-400'}`}
                    >
                        <BarChart3 className={`w-6 h-6 ${activeTab === 'performance' ? 'fill-[#4F46E5]/10' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Stats</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'team' ? 'text-[#4F46E5] scale-110' : 'text-gray-400'}`}
                    >
                        <Users className={`w-6 h-6 ${activeTab === 'team' ? 'fill-[#4F46E5]/10' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Team</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('clients')}
                        className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'clients' ? 'text-[#4F46E5] scale-110' : 'text-gray-400'}`}
                    >
                        <Contact className={`w-6 h-6 ${activeTab === 'clients' ? 'fill-[#4F46E5]/10' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Clients</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'settings' ? 'text-[#4F46E5] scale-110' : 'text-gray-400'}`}
                    >
                        <UserIcon className={`w-6 h-6 ${activeTab === 'settings' ? 'fill-[#4F46E5]/10' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
                    </button>
                </div>
            </main>
        </div>
    );
}
