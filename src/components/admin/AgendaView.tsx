import React from 'react';
import { Appointment, Staff, Service } from '@/types';
import { format, isSameDay, parseISO, startOfDay, addDays } from 'date-fns';
import { Clock, MapPin, User, MoreHorizontal, Calendar as CalendarIcon } from 'lucide-react';
import Image from 'next/image';

interface AgendaViewProps {
    appointments: Appointment[];
    selectedDate: Date;
    staff: Staff[];
    services: Service[];
    onAppointmentClick: (apt: Appointment) => void;
    onSelectSlot?: (date: Date, time: string) => void;
}

export default function AgendaView({
    appointments,
    selectedDate,
    staff,
    services,
    onAppointmentClick,
    onSelectSlot
}: AgendaViewProps) {
    // 1. Group appointments by day
    // For now, we show the selected date + next 6 days (Week view equivalent in list form)
    // Or just the selected date if the user wants a "Day List". 
    // Let's stick to "Selected Date" list for parity with Day View, 
    // but maybe show "No events" emptiness nicely.

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const dayAppointments = appointments
        .filter(apt => apt.date === dateKey && apt.status !== 'CANCELLED' && apt.status !== 'ARCHIVED')
        .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

    // Helper: 12h format
    const formatTime12 = (time24: string) => {
        const [h, m] = time24.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h > 12 ? h - 12 : (h === 0 || h === 12 ? 12 : h);
        return { time: `${displayH}:${m.toString().padStart(2, '0')}`, period };
    };

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 pb-24 animate-in fade-in duration-300">
            {/* Date Header Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mb-6 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-white/90">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                        {format(selectedDate, 'EEEE')}
                    </h2>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">
                        {format(selectedDate, 'MMMM d, yyyy')}
                    </p>
                </div>
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 font-black text-lg shadow-sm">
                    {format(selectedDate, 'd')}
                </div>
            </div>

            {/* Empty State */}
            {dayAppointments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <CalendarIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">No appointments</p>
                    <p className="text-sm text-gray-500 max-w-[200px] mt-1">
                        You&apos;re completely free on this day. Time to relax or build something new.
                    </p>
                    {onSelectSlot && (
                        <button
                            onClick={() => onSelectSlot(selectedDate, '09:00')}
                            className="mt-6 px-6 py-3 bg-white border border-gray-200 shadow-sm rounded-xl font-bold text-sm text-gray-900 hover:bg-gray-50 transition-colors"
                        >
                            + Create Event
                        </button>
                    )}
                </div>
            )}

            {/* List */}
            <div className="space-y-3">
                {dayAppointments.map((apt) => {
                    const staffMember = staff.find(s => s.id === apt.staffId);
                    const service = services.find(s => s.id === apt.serviceId);
                    const { time, period } = formatTime12(apt.timeSlot);

                    return (
                        <div
                            key={apt.id}
                            onClick={() => onAppointmentClick(apt)}
                            className="group bg-white rounded-[1.5rem] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all cursor-pointer active:scale-[0.98] flex gap-5 relative overflow-hidden"
                        >
                            {/* Left: Time Column */}
                            <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-gray-50 pr-5">
                                <span className="text-lg font-black text-gray-900">{time}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{period}</span>
                            </div>

                            {/* Center: Details */}
                            <div className="flex-1 min-w-0 py-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-extrabold text-gray-900 text-[15px] truncate">
                                        {apt.clientName}
                                    </h3>
                                    {apt.status === 'CONFIRMED' && (
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                                    )}
                                </div>

                                <p className="text-sm font-bold text-[#7C3AED] mb-2 truncate">
                                    {apt.serviceName || service?.name || 'Unknown Service'}
                                </p>

                                <div className="flex items-center gap-3">
                                    {/* Staff Badge */}
                                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                                        {staffMember?.avatar ? (
                                            <Image src={staffMember.avatar} width={16} height={16} className="rounded-full object-cover" alt="" unoptimized />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-[8px] font-bold text-white">
                                                {(apt.staffName || staffMember?.name || '?').charAt(0)}
                                            </div>
                                        )}
                                        <span className="text-[10px] font-bold text-gray-500 truncate max-w-[80px]">
                                            {apt.staffName || staffMember?.name || 'Unknown'}
                                        </span>
                                    </div>

                                    {/* Duration Badge */}
                                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        <span className="text-[10px] font-bold text-gray-500">
                                            {apt.durationMinutes || service?.durationMinutes || 60}m
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Action Indicator */}
                            <div className="flex items-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-1/2 -translate-y-1/2">
                                <MoreHorizontal className="w-5 h-5 text-gray-300" />
                            </div>

                            {/* Blue Accent Bar */}
                            <div className="absolute left-0 top-4 bottom-4 w-1 bg-[#7C3AED] rounded-r-full"></div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Safe Area Spacer */}
            <div className="h-20"></div>
        </div>
    );
}
