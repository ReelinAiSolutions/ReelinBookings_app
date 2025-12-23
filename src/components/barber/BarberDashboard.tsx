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
    Plus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import StaffStats from './BarberStats';
import StaffProfile from './BarberProfile';
import VerticalDayTimeline from '../admin/VerticalDayTimeline';
import WeeklyCalendar from '../admin/WeeklyCalendar';
import PersonalWeeklyView from './PersonalWeeklyView';
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
    const [activeTab, setActiveTab] = useState<'schedule' | 'performance' | 'profile'>('schedule');
    const [viewMode, setViewMode] = useState<'my_day' | 'my_week' | 'team_week'>('my_day');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDayTimelineView, setIsDayTimelineView] = useState(false);
    const [isWeekTimelineView, setIsWeekTimelineView] = useState(true); // Default to grid for week
    const [todayStr, setTodayStr] = useState<string>('');
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
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
        if (onRefresh) await onRefresh();
        setIsCreateModalOpen(false);
    };

    const handleAppointmentClick = (apt: Appointment) => {
        setSelectedAppointment(apt);
    };

    const handleReschedule = async (id: string, date: string, time: string, staffId: string) => {
        await updateAppointment(id, { date, timeSlot: time, staffId });
        if (onRefresh) await onRefresh();
        // Also trigger status update prop if just to be safe, though separate
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

    useEffect(() => {
        setTodayStr(format(new Date(), 'yyyy-MM-dd'));
        setCurrentTime(new Date());
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const effectiveStaffId = currentStaffId || currentUser.id;

    // Filter appointments for this staff member
    const allMyAppointments = appointments.filter((a: Appointment) => a.staffId === effectiveStaffId && a.status !== 'CANCELLED');
    const myTodayAppointments = allMyAppointments
        .filter((a: Appointment) => a.date === todayStr)
        .sort((a: Appointment, b: Appointment) => a.timeSlot.localeCompare(b.timeSlot));

    const toMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const nowMinutes = toMinutes(format(new Date(), 'HH:mm'));

    const currentOrNext = myTodayAppointments.find((a: Appointment) => {
        if (a.status === 'COMPLETED' || a.status === 'ARCHIVED') return false;
        const service = services.find((s: Service) => s.id === a.serviceId);
        const duration = service?.durationMinutes || 30;
        const startMins = toMinutes(a.timeSlot);
        const endMins = startMins + duration;
        return endMins > nowMinutes;
    });

    const isPast = (a: Appointment) => {
        const service = services.find((s: Service) => s.id === a.serviceId);
        const duration = service?.durationMinutes || 30;
        const startMins = toMinutes(a.timeSlot);
        return (startMins + duration) <= nowMinutes;
    };

    const getViewLabel = () => {
        switch (viewMode) {
            case 'my_day': return 'My Day';
            case 'my_week': return 'My Week';
            case 'team_week': return 'Team Schedule';
            default: return 'Schedule';
        }
    };


    // Dynamic Branding Style
    const brandingStyle = currentOrg?.primary_color ? {
        '--brand-primary': currentOrg.primary_color,
    } as React.CSSProperties : {};

    return (
        <div
            className="min-h-screen bg-gray-50 flex flex-col lg:block overflow-x-hidden"
            style={brandingStyle}
        >
            <BrandingInjector primaryColor={currentOrg?.primary_color} />
            {/* Desktop Sidebar (Fixed) */}
            <StaffSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                currentOrg={currentOrg || null}
            />

            {/* Main Content Area */}
            <main className={`lg:ml-64 lg:min-h-screen ${activeTab === 'schedule' ? 'lg:flex lg:flex-col lg:h-[100dvh] block min-h-screen' : 'block min-h-screen'}`}>

                {/* Content Container */}
                <div className={` min-h-0 bg-gray-50 ${activeTab === 'schedule' ? 'lg:flex-1 lg:flex lg:flex-col lg:p-6 pb-24 px-4 py-4 min-h-0' : 'lg:p-6 px-4 py-4 lg:py-6 pb-24 space-y-6'}`}>
                    {/* Mobile Header (Scrolls Away) */}
                    <div className="lg:hidden flex-shrink-0 bg-white border-b border-gray-200/50 px-6 flex items-center justify-between h-16 -mx-4 -mt-4 mb-6">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-1 bg-white rounded-lg shadow-sm border border-gray-100">
                                {currentOrg?.logo_url ? (
                                    <img suppressHydrationWarning src={currentOrg.logo_url} alt="Logo" className="w-7 h-7 flex-shrink-0 object-contain" />
                                ) : (
                                    <div className="w-7 h-7 rounded-md bg-gray-900 flex items-center justify-center text-white flex-shrink-0">
                                        <Globe className="w-3 h-3" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-black text-primary-600/60 uppercase tracking-widest leading-none mb-0.5">Team Portal</span>
                                <h1 className="text-sm font-black text-gray-900 tracking-tight leading-none truncate">
                                    {currentOrg?.name || 'Reelin Bookings'}
                                </h1>
                            </div>
                        </div>
                    </div>

                    {activeTab === 'schedule' && (
                        <div className="lg:flex-1 lg:flex lg:flex-col lg:overflow-hidden block animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Standardized Header (Matches Stats/Profile) */}
                            <div className="flex flex-col gap-6 mb-6 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="relative z-[150]">
                                        <button
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="group text-left"
                                        >
                                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2 md:gap-3 group-hover:text-primary-600 transition-colors">
                                                <div className="p-2 bg-primary-50 rounded-xl">
                                                    {viewMode === 'my_day' ? <Layout className="w-6 h-6 md:w-8 md:h-8 text-primary-600" /> : <CalendarIcon className="w-6 h-6 md:w-8 md:h-8 text-primary-600" />}
                                                </div>
                                                {getViewLabel()}
                                                <ChevronDown className={`w-5 h-5 text-gray-400 mt-1 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                            </h1>
                                            <p className="text-gray-500 text-xs md:text-sm font-medium mt-1 ml-12 md:ml-14">
                                                {viewMode === 'team_week' ? 'Toggle staff views' : format(new Date(), 'EEEE, MMMM do')}
                                            </p>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {isDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                                                <div className="absolute top-full left-0 mt-4 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="text-[10px] uppercase font-black text-gray-400 px-4 py-2 tracking-widest">Personal View</div>
                                                    <button
                                                        onClick={() => { setViewMode('my_day'); setIsDropdownOpen(false); }}
                                                        className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${viewMode === 'my_day' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                                    >
                                                        <Layout className="w-4 h-4" /> My Day
                                                    </button>
                                                    <button
                                                        onClick={() => { setViewMode('my_week'); setIsDropdownOpen(false); }}
                                                        className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${viewMode === 'my_week' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                                    >
                                                        <CalendarIcon className="w-4 h-4" /> My Week
                                                    </button>

                                                    <div className="h-px bg-gray-100 my-2 mx-2"></div>

                                                    <div className="text-[10px] uppercase font-black text-gray-400 px-4 py-2 tracking-widest">Team View</div>
                                                    <button
                                                        onClick={() => { setViewMode('team_week'); setIsDropdownOpen(false); }}
                                                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all text-gray-600 hover:bg-gray-50"
                                                    >
                                                        <Users className="w-4 h-4" /> Team Schedule
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* View Toggles (Cards vs Timeline) */}
                                    {viewMode === 'my_day' && (
                                        <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-gray-200 shadow-sm self-start">
                                            <button
                                                onClick={() => setIsDayTimelineView(false)}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isDayTimelineView ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                Cards
                                            </button>
                                            <button
                                                onClick={() => setIsDayTimelineView(true)}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDayTimelineView ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                Timeline
                                            </button>
                                        </div>
                                    )}

                                    {viewMode === 'my_week' && (
                                        <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-gray-200 shadow-sm self-start">
                                            <button
                                                onClick={() => setIsWeekTimelineView(false)}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isWeekTimelineView ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                Cards
                                            </button>
                                            <button
                                                onClick={() => setIsWeekTimelineView(true)}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isWeekTimelineView ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                Timeline
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* View Content Container */}
                            <div className={`flex-1 overflow-hidden relative ${(viewMode === 'team_week' || (viewMode === 'my_week' && isWeekTimelineView) || (viewMode === 'my_day' && isDayTimelineView))
                                ? 'bg-transparent'
                                : 'bg-white lg:rounded-b-2xl border-x lg:border-b border-gray-100 shadow-sm'
                                }`}>
                                {viewMode === 'my_day' && (
                                    <div className="h-full overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300">
                                        {isDayTimelineView ? (
                                            <div className="h-full bg-white lg:rounded-xl lg:border lg:border-gray-200 lg:shadow-sm overflow-hidden flex flex-col mx-4 lg:mx-0">
                                                <VerticalDayTimeline
                                                    appointments={allMyAppointments.filter((a: Appointment) => a.date === todayStr)}
                                                    staff={staff.filter((s: Staff) => s.id === effectiveStaffId)}
                                                    services={services}
                                                    availability={availability}
                                                    businessHours={currentOrg?.business_hours}
                                                    date={currentTime || new Date()}
                                                    onAppointmentClick={(id) => {
                                                        const apt = appointments.find(a => a.id === id);
                                                        if (apt) handleAppointmentClick(apt);
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-full overflow-y-auto lg:p-6 pb-32">
                                                <div className="max-w-xl mx-auto space-y-10 py-8 px-4 pb-12">

                                                    {/* Completed Section (Subtle) */}
                                                    {myTodayAppointments.filter((a: Appointment) => isPast(a) || a.status === 'COMPLETED').length > 0 && (
                                                        <div className="space-y-4 opacity-60 hover:opacity-100 transition-opacity duration-300">
                                                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 font-mono">Completed Today</h3>
                                                            {myTodayAppointments.filter((a: Appointment) => isPast(a) || a.status === 'COMPLETED').map((apt: Appointment) => (
                                                                <div key={apt.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center gap-5">
                                                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-500 shadow-sm border border-gray-100">
                                                                        <CheckCircle2 className="w-5 h-5" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="font-bold text-gray-700 line-through text-lg">{apt.clientName}</div>
                                                                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mt-0.5">
                                                                            {apt.timeSlot} • {services.find((s: Service) => s.id === apt.serviceId)?.name}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <div className="flex justify-center">
                                                                <div className="h-8 w-px bg-gradient-to-b from-gray-200 to-transparent"></div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Hero section for Up Next / In Progress */}
                                                    {currentOrNext ? (
                                                        <div className="relative group">
                                                            <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                                                            <div className="relative bg-white rounded-[2.25rem] shadow-2xl border border-gray-100 overflow-hidden">
                                                                <div className="bg-gray-900 px-8 py-5 flex justify-between items-center">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                                                                        <span className="text-white font-black text-xs tracking-[0.2em] uppercase">
                                                                            {toMinutes(currentOrNext.timeSlot) <= nowMinutes ? 'Active Session' : 'Up Next'}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-white font-mono font-black text-2xl tracking-tighter">{currentOrNext.timeSlot}</span>
                                                                </div>
                                                                <div className="p-10 text-center">
                                                                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100 shadow-inner">
                                                                        <UserIcon className="w-10 h-10 text-gray-300" />
                                                                    </div>
                                                                    <h3 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">{currentOrNext.clientName}</h3>
                                                                    <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-primary-50 text-primary-700 font-black text-xs uppercase tracking-widest shadow-sm border border-primary-100">
                                                                        <Briefcase className="w-4 h-4" />
                                                                        {services.find((s: Service) => s.id === currentOrNext.serviceId)?.name || 'Service'}
                                                                    </div>

                                                                    {currentOrNext.notes && (
                                                                        <div className="mt-8 relative">
                                                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase">Notes</div>
                                                                            <p className="text-sm text-gray-600 font-medium italic bg-gray-50/50 p-5 rounded-2xl border border-gray-100/50">
                                                                                "{currentOrNext.notes}"
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-center gap-4">
                                                                        <Button
                                                                            onClick={() => onStatusUpdate(currentOrNext.id, 'COMPLETED')}
                                                                            className="bg-primary-600 hover:bg-primary-700 text-white rounded-2xl h-14 px-10 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary-600/30 transition-all hover:-translate-y-1 active:scale-95"
                                                                        >
                                                                            Mark as Complete
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white rounded-[2.25rem] p-16 text-center border border-gray-100 shadow-xl relative overflow-hidden group">
                                                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                                                            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                                                <CheckCircle2 className="w-12 h-12" />
                                                            </div>
                                                            <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">All Set!</h3>
                                                            <p className="text-gray-500 font-medium text-lg">You've finished all your appointments for today.</p>
                                                            <Button
                                                                onClick={() => setViewMode('my_week')}
                                                                className="mt-8 bg-gray-900 text-white rounded-xl shadow-lg border-b-4 border-gray-950 px-6 py-2 text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
                                                            >
                                                                Check Weekly Schedule
                                                            </Button>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 px-2 font-mono">Upcoming Appointments</h3>
                                                        <div className="space-y-4">
                                                            {myTodayAppointments
                                                                .filter((a: Appointment) => !isPast(a) && a.status !== 'COMPLETED' && a.id !== currentOrNext?.id)
                                                                .map((apt: Appointment) => (
                                                                    <div key={apt.id} className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group">
                                                                        <div className="flex items-center gap-6">
                                                                            <div className="font-mono font-black text-gray-900 text-2xl tracking-tighter w-20 group-hover:text-primary-600 transition-colors">{apt.timeSlot}</div>
                                                                            <div className="w-px h-12 bg-gray-100"></div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="font-black text-gray-900 text-xl truncate tracking-tight">{apt.clientName}</div>
                                                                                <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mt-0.5">
                                                                                    {services.find((s: Service) => s.id === apt.serviceId)?.name}
                                                                                </div>
                                                                            </div>
                                                                            <span className="bg-gray-50 text-gray-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border border-gray-100 shadow-sm">
                                                                                {apt.status}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            {myTodayAppointments.filter((a: Appointment) => !isPast(a) && a.status !== 'COMPLETED' && a.id !== currentOrNext?.id).length === 0 && (
                                                                <div className="text-center py-12 text-gray-400 text-sm font-bold uppercase tracking-widest bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
                                                                    No more sessions scheduled
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {viewMode === 'my_week' && (
                                    <div className="h-full animate-in fade-in slide-in-from-right-4 duration-300 overflow-hidden pb-10 lg:pb-0">
                                        {isWeekTimelineView ? (
                                            <div className="h-full bg-white lg:rounded-xl lg:border lg:border-gray-200 lg:shadow-sm overflow-hidden flex flex-col mx-4 lg:mx-0">
                                                <WeeklyCalendar
                                                    appointments={allMyAppointments}
                                                    staff={staff.filter((s: Staff) => s.id === effectiveStaffId)}
                                                    services={services}
                                                    availability={availability}
                                                    businessHours={currentOrg?.business_hours}
                                                    onSelectSlot={() => { }}
                                                    onAppointmentClick={handleAppointmentClick}
                                                    colorMode={currentOrg?.settings?.color_mode || 'staff'}
                                                />
                                            </div>
                                        ) : (
                                            <PersonalWeeklyView
                                                appointments={allMyAppointments}
                                                services={services}
                                                availability={availability}
                                                staffId={effectiveStaffId}
                                            />
                                        )}
                                    </div>
                                )}

                                {viewMode === 'team_week' && (
                                    <div className="h-full animate-in fade-in slide-in-from-right-4 duration-300 overflow-hidden pb-10 lg:pb-0 px-0 lg:px-0">
                                        <div className="h-full bg-white lg:rounded-xl lg:border lg:border-gray-200 lg:shadow-sm overflow-hidden flex flex-col">
                                            <WeeklyCalendar
                                                appointments={appointments.filter((a: Appointment) => a.status !== 'CANCELLED')}
                                                staff={staff}
                                                services={services}
                                                availability={availability}
                                                businessHours={currentOrg?.business_hours}
                                                onSelectSlot={handleSelectSlot}
                                                onAppointmentClick={handleAppointmentClick}
                                            />
                                        </div>
                                    </div>
                                )}

                                {viewMode === 'team_week' && activeTab === 'schedule' && (
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="lg:hidden fixed bottom-24 right-4 w-14 h-14 bg-primary-600 text-white rounded-full shadow-xl flex items-center justify-center z-40 hover:bg-primary-700 active:scale-95 transition-all animate-in zoom-in duration-300"
                                    >
                                        <Plus className="w-8 h-8" />
                                    </button>
                                )}
                            </div>
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

                    {activeTab === 'profile' && (
                        <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto">
                            <StaffProfile
                                currentUser={currentUser}
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
                <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-lg border-t border-gray-100 flex justify-around items-center z-50 px-6 pb-2">
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'schedule' ? 'text-primary-600 scale-110' : 'text-gray-400'}`}
                    >
                        <CalendarIcon className={`w-6 h-6 ${activeTab === 'schedule' ? 'fill-primary-50' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Schedule</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'performance' ? 'text-primary-600 scale-110' : 'text-gray-400'}`}
                    >
                        <BarChart3 className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Stats</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'profile' ? 'text-primary-600 scale-110' : 'text-gray-400'}`}
                    >
                        <UserIcon className={`w-6 h-6 ${activeTab === 'profile' ? 'fill-primary-50' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
                    </button>
                </div>
            </main>
        </div>
    );
}
