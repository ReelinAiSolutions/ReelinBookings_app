import React from 'react';
import { Appointment } from '@/types';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface TodayPanelProps {
    appointments: Appointment[];
}

export default function TodayPanel({ appointments }: TodayPanelProps) {
    // Filter for today (mock filter for now, assuming all dates are strings YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysAppointments = appointments
        .filter(a => a.date === todayStr)
        .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

    const nextBooking = todaysAppointments.find(a => {
        const now = new Date();
        const [hours, mins] = a.timeSlot.split(':').map(Number);
        const bookingTime = new Date();
        bookingTime.setHours(hours, mins, 0, 0);
        return bookingTime > now;
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Today's Pulse</h3>
                <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, MMMM do')}</p>
            </div>

            {/* Next Up Hero */}
            <div className="mx-6 mt-6 p-4 bg-primary-50 rounded-xl border border-primary-100 mb-6">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Clock className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-primary-600 uppercase tracking-wide">Next Up</div>
                        {nextBooking ? (
                            <>
                                <div className="text-lg font-bold text-gray-900 mt-1">{nextBooking.timeSlot}</div>
                                <div className="text-sm text-gray-700">{nextBooking.clientName}</div>
                                <div className="text-xs text-gray-500 mt-1">Standard Cut • 30m</div>
                            </>
                        ) : (
                            <div className="text-sm text-gray-600 mt-1">No more bookings today.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-auto px-6 pb-6 space-y-4">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Schedule ({todaysAppointments.length})</div>

                {todaysAppointments.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        No bookings for today yet.
                    </div>
                )}

                {todaysAppointments.map((apt, idx) => (
                    <div key={apt.id} className="group flex gap-4 items-start">
                        <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-primary-500 transition-colors mt-2"></div>
                            {idx !== todaysAppointments.length - 1 && <div className="w-0.5 h-full bg-gray-100 my-1"></div>}
                        </div>
                        <div className="flex-1 pb-4">
                            <div className="flex justify-between items-start">
                                <span className="text-sm font-bold text-gray-900">{apt.timeSlot}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                    }`}>{apt.status}</span>
                            </div>
                            <div className="text-sm text-gray-600 font-medium">{apt.clientName}</div>
                            <div className="text-xs text-gray-400 mt-0.5">Staff ID: {apt.staffId}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Stats Footer */}
            <div className="bg-gray-50 border-t border-gray-100 p-4">
                <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{todaysAppointments.length}</div>
                    <div className="text-xs text-gray-500 capitalize">Bookings</div>
                </div>
            </div>
        </div>
    );
}
