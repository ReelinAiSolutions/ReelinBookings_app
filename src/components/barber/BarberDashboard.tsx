import React, { useState, useEffect } from 'react';
import { Appointment, Service, User, Staff, Organization } from '@/types';
import { format } from 'date-fns';
import { Clock, CheckCircle2, Scissors, User as UserIcon, Calendar as CalendarIcon, BarChart2, ChevronDown, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import BarberStats from './BarberStats';
import BarberProfile from './BarberProfile';
import VerticalDayTimeline from '../admin/VerticalDayTimeline';
import WeeklyCalendar from '../admin/WeeklyCalendar'; // Import Admin Weekly Calendar
import PersonalWeeklyView from './PersonalWeeklyView'; // Import the new List View

interface BarberDashboardProps {
    appointments: Appointment[];
    currentUser: User;
    currentStaffId?: string;
    services: Service[];
    staff?: Staff[];
    availability?: any[]; // Added availability prop
    businessHours?: Organization['business_hours'];
    onStatusUpdate: (appointmentId: string, status: string) => Promise<void>;
}

type ViewMode = 'my_day' | 'my_week' | 'team_day' | 'team_week';

export default function BarberDashboard({
    appointments,
    currentUser,
    currentStaffId,
    services,
    staff = [],
    availability = [], // Destructure with default
    businessHours,
    onStatusUpdate
}: BarberDashboardProps) {
    const [activeTab, setActiveTab] = useState<'calendar' | 'stats' | 'profile'>('calendar');
    const [viewMode, setViewMode] = useState<ViewMode>('my_day');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Dropdown state
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [todayStr, setTodayStr] = useState<string>('');
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    // Fix: Ensure we use the CLIENT'S local date/time to avoid Server (UTC) vs Client (PST) mismatches
    useEffect(() => {
        setTodayStr(format(new Date(), 'yyyy-MM-dd'));
        setCurrentTime(new Date());

        // Optional: Update time every minute to keep "Up Next" fresh
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    // Filter for TODAY and MY appointments
    const effectiveStaffId = currentStaffId || currentUser.id;

    const myAppointments = appointments
        .filter(a => a.staffId === effectiveStaffId && a.date === todayStr && a.status !== 'CANCELLED')
        .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

    // Helper: Convert "HH:mm" to minutes for comparison
    const toMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const nowMinutes = toMinutes(format(new Date(), 'HH:mm'));

    // Find "Next Up" or "In Progress" based on TIME, not just status
    const currentOrNext = myAppointments.find(a => {
        // Must not be completed/archived
        if (a.status === 'COMPLETED' || a.status === 'ARCHIVED') return false;

        // Calculate end time
        const service = services.find(s => s.id === a.serviceId);
        const duration = service?.durationMinutes || 30; // Default to 30 if missing
        const startMins = toMinutes(a.timeSlot);
        const endMins = startMins + duration;

        // Valid if:
        // 1. It is currently happening (Start <= Now < End)
        // 2. OR It is in the future (Start > Now)
        return endMins > nowMinutes;
    });

    // Anything that finishes before now is "Past", even if not marked completed nicely
    const isPast = (a: any) => {
        const service = services.find(s => s.id === a.serviceId);
        const duration = service?.durationMinutes || 30;
        const startMins = toMinutes(a.timeSlot);
        return (startMins + duration) <= nowMinutes;
    };

    const handleAction = async (id: string, newStatus: string) => {
        setIsLoading(id);
        await onStatusUpdate(id, newStatus);
        setIsLoading(null);
    };

    // Helper to get Label for Header
    const getViewLabel = () => {
        switch (viewMode) {
            case 'my_day': return 'My Day';
            case 'my_week': return 'My Week';
            case 'team_week': return 'Team Schedule';
            default: return 'Schedule';
        }
    };

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            {/* CONTENT AREA */}
            <div className="flex-1 flex flex-col overflow-hidden relative pb-16">
                {activeTab === 'calendar' && (
                    <>
                        {/* Header with Dropdown */}
                        <div className="bg-white px-6 py-4 shadow-sm flex flex-shrink-0 justify-between items-center z-30 relative">
                            <div>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 group"
                                >
                                    <h1 className="text-2xl font-black text-gray-900 transition-colors group-hover:text-gray-600">
                                        {getViewLabel()}
                                    </h1>
                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <p className="text-sm text-gray-500 font-medium">{format(new Date(), 'EEEE, MMM do')}</p>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <>
                                        {/* Backdrop to close */}
                                        <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>

                                        <div className="absolute top-full left-6 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="text-[10px] uppercase font-bold text-gray-400 px-3 py-2">Personal</div>
                                            <button
                                                onClick={() => { setViewMode('my_day'); setIsDropdownOpen(false); }}
                                                className={`flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-lg transition-colors ${viewMode === 'my_day' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                <CalendarIcon className="w-4 h-4" /> My Day
                                            </button>
                                            <button
                                                onClick={() => { setViewMode('my_week'); setIsDropdownOpen(false); }}
                                                className={`flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-lg transition-colors ${viewMode === 'my_week' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                <CalendarIcon className="w-4 h-4" /> My Week
                                            </button>

                                            <div className="h-px bg-gray-100 my-1"></div>

                                            <div className="text-[10px] uppercase font-bold text-gray-400 px-3 py-2">Team</div>
                                            <button
                                                onClick={() => { setViewMode('team_week'); setIsDropdownOpen(false); }}
                                                className={`flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-lg transition-colors ${viewMode === 'team_week' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                <Users className="w-4 h-4" /> Team Schedule
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* VIEW CONTENT */}
                        {viewMode === 'my_day' && (
                            <div className="flex-1 overflow-y-auto w-full animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="max-w-lg mx-auto p-6 space-y-6">

                                    {/* 1. PAST / COMPLETED SECTION */}
                                    {myAppointments.filter(a => isPast(a) || a.status === 'COMPLETED').length > 0 && (
                                        <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">
                                                Completed Today
                                            </h3>
                                            {myAppointments
                                                .filter(a => isPast(a) || a.status === 'COMPLETED')
                                                .map(apt => (
                                                    <div key={apt.id} className="bg-gray-100 p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                            <CheckCircle2 className="w-5 h-5 text-gray-500" />
                                                        </div>
                                                        <div>
                                                            {/* Auto-strike through if past, regardless of status */}
                                                            <div className="font-bold text-gray-600 line-through">{apt.clientName}</div>
                                                            <div className="text-xs text-gray-400 font-medium">{apt.timeSlot} - {services.find(s => s.id === apt.serviceId)?.name}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            <div className="flex justify-center">
                                                <div className="h-4 w-px bg-gray-300"></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. CURRENT HERO SECTION */}
                                    {currentOrNext ? (
                                        <div className="relative transform transition-all duration-300 hover:scale-[1.02]">
                                            <div className="absolute -inset-1 bg-gradient-to-br from-blue-100 to-purple-100 rounded-[2rem] blur-sm opacity-70"></div>
                                            <div className="relative bg-white rounded-[1.75rem] shadow-2xl overflow-hidden border border-gray-100">
                                                {/* Header Strip */}
                                                <div className="bg-gray-900 px-6 py-5 flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                                        <span className="text-white font-black text-sm tracking-widest uppercase">
                                                            {/* Distinguish Up Next vs In Chair */}
                                                            {currentOrNext && toMinutes(currentOrNext.timeSlot) <= nowMinutes
                                                                ? 'In Chair'
                                                                : 'Up Next'
                                                            }
                                                        </span>
                                                    </div>
                                                    <span className="text-white/90 font-mono font-bold text-2xl tracking-tight">{currentOrNext.timeSlot}</span>
                                                </div>

                                                {/* Main Content */}
                                                <div className="p-8">
                                                    <div className="flex flex-col items-center text-center gap-4 mb-8">
                                                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center shadow-inner border border-gray-100">
                                                            <UserIcon className="w-10 h-10 text-gray-400" />
                                                        </div>
                                                        <div>
                                                            <h2 className="text-3xl font-black text-gray-900 leading-tight mb-2">{currentOrNext.clientName}</h2>
                                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold text-sm">
                                                                <Scissors className="w-4 h-4" />
                                                                <span>
                                                                    {services.find(s => s.id === currentOrNext.serviceId)?.name || 'Service'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {currentOrNext.notes && (
                                                            <div className="w-full bg-yellow-50 text-yellow-800 text-sm p-3 rounded-xl font-medium border border-yellow-100">
                                                                "{currentOrNext.notes}"
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Status Footer */}
                                                    <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 font-medium">
                                                        <span>Status</span>
                                                        <span className="font-black text-gray-900 uppercase tracking-wide bg-gray-100 px-3 py-1 rounded-lg">{currentOrNext.status}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-center mt-6">
                                                <div className="h-4 w-px bg-gray-300"></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-lg mb-8">
                                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                                <CheckCircle2 className="w-10 h-10" />
                                            </div>
                                            <h2 className="text-2xl font-black text-gray-900 mb-2">All Caught Up!</h2>
                                            <p className="text-gray-500">You've finished all appointments for today.</p>
                                        </div>
                                    )}

                                    {/* 3. FUTURE / UPCOMING SECTION */}
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Coming Up Later</h3>
                                        <div className="space-y-3">
                                            {/* Filter out Past, Completed, AND CurrentOrNext */}
                                            {myAppointments
                                                .filter(a => !isPast(a) && a.status !== 'COMPLETED' && a.id !== currentOrNext?.id)
                                                .map((apt, i) => (
                                                    <div key={apt.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 active:scale-[0.98] transition-all">
                                                        <div className="font-mono font-black text-gray-900 text-xl w-16 opacity-80">{apt.timeSlot}</div>
                                                        <div className="w-px h-12 bg-gray-100"></div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-lg">{apt.clientName}</div>
                                                            <div className="text-sm text-gray-500 font-medium">
                                                                {services.find(s => s.id === apt.serviceId)?.name || 'Service'}
                                                            </div>
                                                        </div>
                                                        <div className="ml-auto">
                                                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                                                                {apt.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            {myAppointments.filter(a => !isPast(a) && a.status !== 'COMPLETED' && a.id !== currentOrNext?.id).length === 0 && (
                                                <div className="text-center py-8 text-gray-400 text-sm font-medium bg-gray-50 rounded-2xl border-dashed border border-gray-200">
                                                    No more appointments scheduled.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}



                        {viewMode === 'my_week' && (
                            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-300 bg-gray-50">
                                <PersonalWeeklyView
                                    appointments={appointments.filter(a => a.staffId === effectiveStaffId && a.status !== 'CANCELLED')}
                                    services={services}
                                    availability={availability}
                                    staffId={effectiveStaffId}
                                />
                            </div>
                        )}

                        {viewMode === 'team_day' && (
                            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-300 bg-white">
                                <VerticalDayTimeline
                                    appointments={appointments.filter(a => a.date === todayStr)}
                                    staff={staff}
                                    services={services}
                                    availability={availability}
                                    businessHours={businessHours}
                                    date={currentTime || new Date()}
                                    onAppointmentClick={() => { }}
                                />
                            </div>
                        )}

                        {viewMode === 'team_week' && (
                            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-300 bg-white">
                                <WeeklyCalendar
                                    appointments={appointments.filter(a => a.status !== 'CANCELLED')}
                                    staff={staff} // Show ALL staff
                                    services={services}
                                    availability={availability}
                                    onSelectSlot={() => { }}
                                    onAppointmentClick={() => { }}
                                />
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'stats' && (
                    <div className="flex-1 overflow-y-auto">
                        <BarberStats
                            appointments={appointments}
                            services={services}
                            currentStaffId={effectiveStaffId}
                        />
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="flex-1 overflow-y-auto">
                        <BarberProfile
                            currentUser={currentUser}
                            user={currentUser}
                        />
                    </div>
                )}
            </div>

            {/* BOTTOM NAV BAR */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 pb-safe-area">
                <button
                    onClick={() => setActiveTab('calendar')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'calendar' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <CalendarIcon className={`w-6 h-6 ${activeTab === 'calendar' ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Schedule</span>
                </button>

                <button
                    onClick={() => setActiveTab('stats')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'stats' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <BarChart2 className={`w-6 h-6 ${activeTab === 'stats' ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Stats</span>
                </button>

                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <UserIcon className={`w-6 h-6 ${activeTab === 'profile' ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
                </button>
            </div>
        </div>
    );
}
