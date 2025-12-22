import React from 'react';
import { Appointment, Service, Availability } from '@/types';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, Video, Briefcase, Coffee } from 'lucide-react';

interface PersonalWeeklyViewProps {
    appointments: Appointment[];
    services: Service[];
    currentDate?: Date;
    availability?: Availability[];
    staffId: string;
}

export default function PersonalWeeklyView({ appointments, services, currentDate = new Date(), availability = [], staffId }: PersonalWeeklyViewProps) {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

    // Helper to get appointments for a specific day
    const getAppointmentsForDay = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return appointments
            .filter(a => a.date === dateStr && a.status !== 'CANCELLED')
            .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
    };

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4 pb-20">
            {weekDays.map(day => {
                const dayAppointments = getAppointmentsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                // Check Availability
                const dayIndex = day.getDay(); // 0-6 Local
                const rule = availability.find(r => r.staffId === staffId && r.dayOfWeek === dayIndex);
                const isOffDuty = rule && !rule.isWorking;

                return (
                    <div key={day.toISOString()} className={`bg-white rounded-2xl shadow-sm border ${isToday ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'} overflow-hidden relative`}>
                        {/* Off Duty Overlay / State */}
                        {isOffDuty && (
                            <div className="absolute inset-0 z-10 bg-gray-50/50 flex flex-col items-center justify-center pointer-events-none">
                                <div className="bg-white/90 px-4 py-2 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
                                    <Coffee className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Off Duty</span>
                                </div>
                            </div>
                        )}

                        {/* Day Header */}
                        <div className={`px-4 py-3 flex items-center justify-between ${isToday ? 'bg-blue-50/50' : 'bg-gray-50/50'} border-b border-gray-100 ${isOffDuty ? 'opacity-50' : ''}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold leading-none shadow-sm ${isToday ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
                                    <span className="text-[10px] uppercase opacity-80">{format(day, 'EEE')}</span>
                                    <span className="text-sm">{format(day, 'd')}</span>
                                </div>
                                <div>
                                    <h3 className={`font-bold ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>{format(day, 'MMMM do')}</h3>
                                    <p className="text-xs text-gray-500 font-medium">
                                        {isOffDuty ? 'Not Scheduled' : `${dayAppointments.length} appointment${dayAppointments.length !== 1 ? 's' : ''}`}
                                    </p>
                                </div>
                            </div>
                            {isToday && <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Today</span>}
                        </div>

                        {/* Appointments List */}
                        <div className={`divide-y divide-gray-50 min-h-[100px] ${isOffDuty ? 'opacity-25' : ''}`}>
                            {dayAppointments.length > 0 ? (
                                dayAppointments.map(apt => {
                                    const service = services.find(s => s.id === apt.serviceId);
                                    return (
                                        <div key={apt.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors group">
                                            {/* Time Column */}
                                            <div className="w-16 flex-shrink-0 flex flex-col items-center justify-center text-center">
                                                <span className="font-black text-gray-900 text-sm">{apt.timeSlot}</span>
                                                <span className="text-[10px] text-gray-400 font-medium uppercase">{parseInt(apt.timeSlot) >= 12 ? 'PM' : 'AM'}</span>
                                            </div>

                                            {/* Divider */}
                                            <div className="w-1 h-10 rounded-full bg-gray-100 group-hover:bg-blue-200 transition-colors"></div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <h4 className={`font-bold text-gray-900 ${apt.status === 'COMPLETED' ? 'line-through opacity-50' : ''}`}>{apt.clientName}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-md">
                                                        <Briefcase className="w-3 h-3" />
                                                        {service?.name || 'Service'}
                                                    </span>
                                                    {apt.status === 'COMPLETED' && <span className="text-[10px] uppercase font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">Done</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-6 text-center h-full flex items-center justify-center">
                                    <p className="text-sm text-gray-400 font-medium italic">
                                        {isOffDuty ? '' : 'No appointments scheduled.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
