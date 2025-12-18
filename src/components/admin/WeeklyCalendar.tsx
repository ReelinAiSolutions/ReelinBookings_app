import React from 'react';
import { Appointment, Staff, Service } from '@/types';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { addDays, format, startOfWeek, addHours, startOfDay, isSameDay } from 'date-fns';

interface WeeklyCalendarProps {
    appointments: Appointment[];
    staff: Staff[];
    services: Service[];
    isBlockingMode?: boolean; // New prop
    onSelectSlot: (date: Date, time: string) => void;
    onAppointmentClick: (appointment: Appointment) => void;
}

export default function WeeklyCalendar({ appointments, staff, services, isBlockingMode = false, onSelectSlot, onAppointmentClick }: WeeklyCalendarProps) {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start

    // Generate week days
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

    // Generate hours (9am - 6pm for MVP)
    const hours = Array.from({ length: 10 }).map((_, i) => i + 9);

    const getAppointmentsForCell = (day: Date, hour: number) => {
        return appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            // Simple check: is same day AND same hour (assuming "10:00" format)
            const aptHour = parseInt(apt.timeSlot?.split(':')[0] || '0');
            return isSameDay(aptDate, day) && aptHour === hour;
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
            {/* Calendar Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-gray-900">
                        {format(startDate, 'MMMM yyyy')}
                    </h2>
                    <div className="flex items-center rounded-md border border-gray-200 bg-white">
                        <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-1 hover:bg-gray-50"><ChevronLeft className="w-5 h-5 text-gray-500" /></button>
                        <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-1 hover:bg-gray-50"><ChevronRight className="w-5 h-5 text-gray-500" /></button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1.5 rounded-md">Week View</span>
                </div>
            </div>

            {/* Desktop Calendar Grid (Hidden on Mobile) */}
            <div className="hidden lg:flex flex-1 overflow-auto flex-col">
                {/* Header Row */}
                <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10 shadow-sm">
                    <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50/50"></div>
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className="flex-1 w-0 min-w-[100px] text-center py-3 border-r border-gray-200 last:border-r-0">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{format(day, 'EEE')}</div>
                            <div className={`text-sm font-black mt-1 w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors ${isSameDay(day, new Date()) ? 'bg-primary-600 text-white shadow-md' : 'text-gray-900 group-hover:bg-gray-100'}`}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Time Grid */}
                <div className="flex-1 bg-white relative">
                    {hours.map(hour => (
                        <div key={hour} className="flex min-h-[120px] border-b border-gray-200">
                            {/* Time Label */}
                            <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50/30 text-xs font-semibold text-gray-400 text-center pt-3">
                                {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
                            </div>

                            {/* Days Columns */}
                            {weekDays.map(day => {
                                const cellApts = getAppointmentsForCell(day, hour);
                                return (
                                    <div
                                        key={`${day.toISOString()}-${hour}`}
                                        onClick={() => onSelectSlot(day, `${hour}:00`)}
                                        className={`flex-1 w-0 min-w-[100px] border-r border-gray-200 last:border-r-0 relative group transition-all p-1.5
                                            ${isBlockingMode
                                                ? 'cursor-cell hover:bg-stripes-gray hover:bg-gray-50 ring-inset hover:ring-2 hover:ring-gray-400'
                                                : 'hover:bg-gray-50/50'
                                            }
                                        `}
                                    >
                                        <div className={`invisible group-hover:visible absolute top-2 right-2 flex items-center justify-center pointer-events-none ${isBlockingMode ? 'text-gray-800' : 'text-gray-300'}`}>
                                            {isBlockingMode ? <span className="text-[10px] font-black uppercase bg-gray-900 text-white px-1.5 py-0.5 rounded">BLOCK</span> : <Plus className="w-5 h-5" />}
                                        </div>

                                        {/* Render Events */}
                                        <div className="flex flex-col gap-1.5 h-full">
                                            {cellApts.map(apt => {
                                                const colors = [
                                                    { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700' },
                                                    { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700' },
                                                    { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700' },
                                                    { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-700' },
                                                    { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-700' },
                                                    { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700' },
                                                    { bg: 'bg-teal-50', border: 'border-teal-500', text: 'text-teal-700' },
                                                    { bg: 'bg-cyan-50', border: 'border-cyan-500', text: 'text-cyan-700' },
                                                ];

                                                const staffIndex = apt.staffId
                                                    ? apt.staffId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
                                                    : 0;

                                                const staffColor = colors[staffIndex];
                                                const staffMember = staff.find(s => s.id === apt.staffId);
                                                const service = services.find(s => s.id === apt.serviceId);

                                                return (
                                                    <div
                                                        key={apt.id}
                                                        className={`p-2.5 rounded text-xs border-l-[3px] shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden group/card
                                                            ${apt.clientName?.startsWith('Blocked')
                                                                ? 'bg-gray-100 border-gray-400 text-gray-500'
                                                                : `${staffColor.bg} ${staffColor.border} ${staffColor.text}`
                                                            }
                                                            ${apt.status === 'CANCELLED' ? 'opacity-60 grayscale-[0.8] border-dashed' : ''}
                                                        `}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAppointmentClick(apt);
                                                        }}
                                                    >
                                                        <div className="font-black text-xs uppercase tracking-wider opacity-90 leading-none mb-1">
                                                            {staffMember?.name?.split(' ')[0] || 'Unassigned'}
                                                        </div>
                                                        <div className="font-bold text-sm truncate opacity-90 leading-tight mb-0.5">
                                                            {apt.clientName}
                                                        </div>
                                                        <div className="text-[10px] truncate opacity-90 font-medium italic mb-1.5 max-w-full">
                                                            {service?.name || 'Service'}
                                                        </div>
                                                        <div className="flex items-center justify-between text-[10px] opacity-70 font-bold border-t border-black/5 pt-1.5">
                                                            <span>{apt.timeSlot}</span>
                                                            {apt.status !== 'CONFIRMED' && <span className="capitalize">{apt.status.toLowerCase()}</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Vertical List View (Visible on Mobile) */}
            <div className="lg:hidden flex flex-col divide-y divide-gray-100">
                {weekDays.map(day => {
                    // Get all appointments for this day
                    const dayApts = appointments
                        .filter(a => isSameDay(new Date(a.date), day))
                        .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

                    const isToday = isSameDay(day, new Date());

                    return (
                        <div key={day.toISOString()} className={`p-4 ${isToday ? 'bg-blue-50/30' : ''}`}>
                            {/* Day Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center border shadow-sm ${isToday ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                                        <span className="text-[10px] uppercase font-bold leading-none">{format(day, 'EEE')}</span>
                                        <span className="text-sm font-black leading-none mt-0.5">{format(day, 'd')}</span>
                                    </div>
                                    {dayApts.length > 0 ? (
                                        <span className="text-xs font-medium text-gray-500">{dayApts.length} bookings</span>
                                    ) : (
                                        <span className="text-xs font-medium text-gray-400 italic">No bookings</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => onSelectSlot(day, '09:00')} // Default to 9am for quick add
                                    className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Appointments Grid */}
                            <div className="space-y-3">
                                {dayApts.map(apt => {
                                    const service = services.find(s => s.id === apt.serviceId);
                                    const staffMember = staff.find(s => s.id === apt.staffId);

                                    return (
                                        <div
                                            key={apt.id}
                                            onClick={() => onAppointmentClick(apt)}
                                            className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-transform"
                                        >
                                            {/* Time Column */}
                                            <div className="flex flex-col items-center min-w-[3.5rem] border-r border-gray-100 pr-3 mr-1">
                                                <span className="text-lg font-bold text-gray-900 leading-none">{apt.timeSlot}</span>
                                                <span className="text-[10px] text-gray-400 font-medium uppercase mt-1">Start</span>
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-gray-900 truncate">{apt.clientName}</h4>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {apt.status === 'CONFIRMED' ? 'OK' : apt.status.slice(0, 3)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                                    {service?.name || 'Service'} with {staffMember?.name.split(' ')[0] || 'Staff'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* Empty State / End of List message */}
                <div className="p-8 text-center text-gray-400 text-sm">
                    No more bookings this week.
                </div>
            </div>
        </div>
    );
}
