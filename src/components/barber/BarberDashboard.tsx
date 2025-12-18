import React, { useState } from 'react';
import { Appointment, Service, User } from '@/types';
import { format } from 'date-fns';
import { Clock, CheckCircle2, Scissors, User as UserIcon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

interface BarberDashboardProps {
    appointments: Appointment[];
    currentUser: User;
    services: Service[];
    onStatusUpdate: (appointmentId: string, status: string) => Promise<void>;
}

export default function BarberDashboard({
    appointments,
    currentUser,
    services,
    onStatusUpdate
}: BarberDashboardProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    // Filter for TODAY and MY appointments
    const todayStr = new Date().toISOString().split('T')[0];
    const myAppointments = appointments
        .filter(a => a.staffId === currentUser.id && a.date === todayStr && a.status !== 'CANCELLED')
        .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

    // Find "Next Up" or "In Progress"
    const now = new Date();
    const currentOrNext = myAppointments.find(a => {
        const [hours, mins] = a.timeSlot.split(':').map(Number);
        const bookingTime = new Date();
        bookingTime.setHours(hours, mins, 0, 0);
        // Include if it's within the last 30 mins (in progress) or future
        // Simple logic: first one that hasn't been completed/archived and is effectively "now or future"
        return a.status !== 'COMPLETED' && a.status !== 'ARCHIVED';
    });

    const handleAction = async (id: string, newStatus: string) => {
        setIsLoading(id);
        await onStatusUpdate(id, newStatus);
        setIsLoading(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white px-6 py-6 shadow-sm flex justify-between items-center sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">My Schedule</h1>
                    <p className="text-sm text-gray-500 font-medium">{format(new Date(), 'EEEE, MMM do')}</p>
                </div>
                <button onClick={handleLogout} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 max-w-lg mx-auto space-y-8">

                {/* HERO: Next Client */}
                {currentOrNext ? (
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                        <div className="bg-gray-900 px-6 py-4 flex justify-between items-center">
                            <span className="text-white font-bold text-sm tracking-wide uppercase">
                                {currentOrNext.status === 'CONFIRMED' ? 'Up Next' : 'In Chair'}
                            </span>
                            <span className="text-white/80 font-mono font-bold text-lg">{currentOrNext.timeSlot}</span>
                        </div>
                        <div className="p-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <UserIcon className="w-8 h-8 text-gray-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 leading-tight">{currentOrNext.clientName}</h2>
                                    <div className="flex items-center gap-2 mt-1 text-gray-500 font-medium">
                                        <Scissors className="w-4 h-4" />
                                        <span>
                                            {services.find(s => s.id === currentOrNext.serviceId)?.name || 'Service'}
                                        </span>
                                    </div>
                                    {currentOrNext.notes && (
                                        <div className="mt-2 bg-yellow-50 text-yellow-800 text-xs p-2 rounded-lg font-medium">
                                            Note: {currentOrNext.notes}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                {currentOrNext.status === 'CONFIRMED' && (
                                    <Button
                                        onClick={() => handleAction(currentOrNext.id, 'ARRIVED')}
                                        isLoading={isLoading === currentOrNext.id}
                                        className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-bold rounded-xl"
                                    >
                                        Mark Arrived
                                    </Button>
                                )}
                                {currentOrNext.status === 'ARRIVED' && (
                                    <Button
                                        onClick={() => handleAction(currentOrNext.id, 'IN_PROGRESS')}
                                        isLoading={isLoading === currentOrNext.id}
                                        className="col-span-2 bg-gray-900 hover:bg-black text-white py-4 text-lg font-bold rounded-xl"
                                    >
                                        Start Cut ✂️
                                    </Button>
                                )}
                                {currentOrNext.status === 'IN_PROGRESS' && (
                                    <Button
                                        onClick={() => handleAction(currentOrNext.id, 'COMPLETED')}
                                        isLoading={isLoading === currentOrNext.id}
                                        className="col-span-2 bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-bold rounded-xl"
                                    >
                                        Finish ✨
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900">All Caught Up!</h2>
                        <p className="text-gray-500 mt-2">No upcoming appointments for today.</p>
                    </div>
                )}

                {/* Vertical Agenda List */}
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Rest of Day</h3>
                    <div className="space-y-3">
                        {myAppointments.filter(a => a.id !== currentOrNext?.id).map((apt, i) => (
                            <div key={apt.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all">
                                <div className="font-mono font-bold text-gray-900 text-lg w-16">{apt.timeSlot}</div>
                                <div className="w-px h-10 bg-gray-100"></div>
                                <div>
                                    <div className="font-bold text-gray-900">{apt.clientName}</div>
                                    <div className="text-xs text-gray-500 font-medium">
                                        {services.find(s => s.id === apt.serviceId)?.name || 'Service'}
                                    </div>
                                </div>
                                <div className="ml-auto">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {apt.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {myAppointments.filter(a => a.id !== currentOrNext?.id).length === 0 && (
                            <div className="text-center py-6 text-gray-400 text-sm italic">
                                Nothing else scheduled.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
