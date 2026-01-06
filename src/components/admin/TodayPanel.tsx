import React, { useState } from 'react';
import { Appointment, Service, Organization } from '@/types';
import { Clock, Mail, Info, User, Calendar, MessageSquare, Phone, ChevronRight, Filter, LayoutGrid, List } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import Image from 'next/image';
import VerticalDayTimeline from './VerticalDayTimeline';

interface TodayPanelProps {
    appointments: Appointment[];
    staff: any[];
    services: Service[];
    availability?: any[]; // New prop
    businessHours?: Organization['business_hours'];
    onAppointmentClick?: (apt: Appointment) => void;
}

export default function TodayPanel({ appointments, staff, services, availability = [], businessHours, onAppointmentClick }: TodayPanelProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [focusedId, setFocusedId] = useState<string | null>(null);

    // ... logic ...


    // Force "Today" to always be interpreted as Vancouver time
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' });

    // Get numeric day of week (0-6) for availability check
    const todayDayOfWeek = new Date().getDay();

    const todaysAppointments = appointments
        .filter(a => a.date === todayStr)
        .filter(a => parseInt(a.timeSlot.split(':')[0]) < 17) // Hide after 5 PM
        .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

    const nextBooking = todaysAppointments.find(a => {
        const now = new Date();
        const [hours, mins] = a.timeSlot.split(':').map(Number);
        const bookingTime = new Date();
        bookingTime.setHours(hours, mins, 0, 0);
        return bookingTime > now;
    });

    const hours = Array.from({ length: 9 }).map((_, i) => i + 9); // 9 AM to 5 PM

    const handleCardClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (focusedId === id) {
            setFocusedId(null);
        } else {
            setFocusedId(id);
        }
    };

    const handleGridClick = () => {
        setFocusedId(null);
    };

    return (
        <div className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-xl shadow-primary-900/10 border border-white/50 h-full flex flex-col overflow-hidden relative" onClick={handleGridClick}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 z-50"></div>
            {/* Header (Shared) */}
            <div className="px-6 py-4 border-b border-primary-100 flex justify-between items-center bg-white/50 flex-shrink-0">
                <div>
                    <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 tracking-tight">
                        Today's Catch <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse"></span>
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">{format(new Date(), 'EEEE, MMMM do')}</p>
                </div>
                <div className="text-sm font-semibold bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {todaysAppointments.length} bookings
                </div>
            </div>

            {/* MOBILE VIEW: Vertical Time x Horizontal Staff */}
            <div className="flex md:hidden flex-1 overflow-hidden relative bg-white">
                <VerticalDayTimeline
                    appointments={todaysAppointments}
                    staff={staff}
                    services={services}
                    availability={availability}
                    businessHours={businessHours}
                    date={new Date()}
                />
            </div>

            {/* DESKTOP VIEW: Horizontal Grid (Hidden on Mobile) */}
            <div className="hidden md:flex flex-1 overflow-auto bg-gray-50/30 relative">
                <div className="min-w-[1000px] h-full flex flex-col"> {/* Ensure min width for scrolling */}

                    {/* Time Header */}
                    <div className="flex border-b border-gray-300 sticky top-0 bg-white z-20 shadow-sm">
                        <div className="w-32 flex-shrink-0 px-3 py-2 bg-gray-50 border-r border-gray-300 text-[10px] font-bold text-gray-700 uppercase tracking-wider sticky left-0 z-30 flex items-center h-8">
                            Staff
                        </div>
                        <div className="flex flex-1 relative">
                            {hours.map((hour, i) => (
                                <div key={hour} className="flex-1 min-w-[70px] text-center border-r border-gray-200 last:border-r-0 flex items-center justify-center h-8">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                                        {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'pm' : 'am'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Staff Rows */}
                    <div className="divide-y divide-gray-200 bg-white flex-1">
                        {staff.map(member => {
                            const memberAppointments = todaysAppointments.filter(apt => apt.staffId === member.id);
                            const TOTAL_HOURS = hours.length;

                            // Check Availability
                            const memberRule = availability.find(r => r.staffId === member.id && r.dayOfWeek === todayDayOfWeek);
                            const isWorking = memberRule?.isWorking;

                            return (
                                <div key={member.id} className="flex group/row h-16 relative">
                                    {/* Staff Header (Sticky Left) */}
                                    <div className="w-32 flex-shrink-0 px-3 border-r border-gray-300 bg-white group-hover/row:bg-gray-50 sticky left-0 z-20 flex items-center gap-2 transition-colors h-full">
                                        <div className="w-7 h-7 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 border border-gray-200 overflow-hidden">
                                            {member.avatar ? <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" /> : member.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col overflow-hidden min-w-0">
                                            <span className="text-xs font-bold text-gray-900 truncate">{member.name.split(' ')[0]}</span>
                                            <span className="text-[9px] font-medium text-gray-500 capitalize truncate">{member.role || 'Staff'}</span>
                                        </div>
                                    </div>

                                    {/* Timeline Lane */}
                                    <div className={`flex-1 relative h-full bg-white ${!isWorking ? 'bg-[url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMTlMMTkgMU0wIDIwTDIwIDAiIHN0cm9rZT0iI2YzZjRmNiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+")]' : ''}`}>

                                        {!isWorking && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                                <span className="text-[10px] font-bold text-gray-400 bg-white/80 px-2 py-0.5 rounded border border-gray-200 uppercase tracking-widest">
                                                    Off Duty
                                                </span>
                                            </div>
                                        )}

                                        {/* Background Grid - Only if working, or always if we want consistency */}
                                        <div className="absolute inset-0 flex pointer-events-none">
                                            {hours.map((hour) => (
                                                <div key={`bg-${hour}`} className="flex-1 border-r border-gray-200"></div>
                                            ))}
                                        </div>

                                        {/* Appointments Layer */}
                                        <div className="absolute inset-0 w-full h-full">
                                            {memberAppointments.map(apt => {
                                                const [h, m] = apt.timeSlot.split(':').map(Number);
                                                const startHour = 9;
                                                const startOffsetMins = ((h - startHour) * 60) + m;
                                                const totalGridMins = TOTAL_HOURS * 60;
                                                const leftPercent = (startOffsetMins / totalGridMins) * 100;

                                                const service = services?.find(s => s.id === apt.serviceId);
                                                const durationMins = service?.durationMinutes || 60;
                                                const widthPercent = (durationMins / totalGridMins) * 100;

                                                const isExpanded = false; // Hover expansion could be re-enabled if desired

                                                // Dynamic Colors (Match Weekly - REFINED PURPLE)
                                                const colors = [
                                                    { bg: 'bg-primary-50', border: 'border-primary-600', text: 'text-primary-600', sub: 'text-primary-600/70' },
                                                    { bg: 'bg-[#FDF4FF]', border: 'border-[#7C3AED]', text: 'text-[#7C3AED]', sub: 'text-[#7C3AED]/70' },
                                                    { bg: 'bg-[#F8F6FF]', border: 'border-[#6D28D9]', text: 'text-[#6D28D9]', sub: 'text-[#6D28D9]/70' },
                                                    { bg: 'bg-primary-50', border: 'border-primary-700', text: 'text-primary-700', sub: 'text-primary-700/70' },
                                                    { bg: 'bg-[#FAF5FF]', border: 'border-[#8B5CF6]', text: 'text-[#8B5CF6]', sub: 'text-[#8B5CF6]/70' },
                                                ];
                                                const staffIndex = apt.staffId ? apt.staffId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length : 0;
                                                const staffColor = colors[staffIndex];

                                                return (
                                                    <div
                                                        key={apt.id}
                                                        className={`absolute rounded border-l-[3px] flex flex-col justify-center cursor-pointer transition-all overflow-hidden shadow-sm hover:shadow-md backdrop-blur-sm
                                                             z-10 hover:z-20
                                                             ${apt.status === 'CONFIRMED' ? `${staffColor.bg} ${staffColor.border}` : 'bg-gray-50 border-gray-400'}
                                                         `}
                                                        style={{
                                                            left: `${Math.max(0, leftPercent)}%`,
                                                            width: `${widthPercent}%`,
                                                            top: '2px', // Tighter
                                                            bottom: '2px', // Tighter
                                                        }}
                                                        onMouseEnter={() => setHoveredId(apt.id)}
                                                        onMouseLeave={() => setHoveredId(null)}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAppointmentClick?.(apt);
                                                        }}
                                                    >
                                                        <div className={`flex flex-col justify-center h-full px-1.5 leading-none ${apt.status === 'CONFIRMED' ? staffColor.text : 'text-gray-900'}`}>
                                                            <div className="font-bold text-[10px] truncate max-w-full">
                                                                {apt.clientName}
                                                            </div>
                                                            {durationMins >= 45 && (
                                                                <div className={`text-[9px] font-medium truncate opacity-80 mt-0.5 ${apt.status === 'CONFIRMED' ? staffColor.sub : 'text-gray-500'}`}>
                                                                    {apt.timeSlot} • {apt.serviceName || service?.name}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>


        </div >
    );
}
