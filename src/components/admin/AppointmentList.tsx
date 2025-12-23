import React from 'react';
import { Appointment } from '@/types';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CalendarX2 } from 'lucide-react'; // Empty state icon

interface AppointmentListProps {
    appointments: Appointment[];
}

export default function AppointmentList({ appointments }: AppointmentListProps) {
    if (appointments.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <CalendarX2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No appointments found</h3>
                <p className="text-gray-500 max-w-sm">
                    There are no appointments scheduled for this period. Share your booking link to get started.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-xl shadow-indigo-100/50 border border-white/40 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 pointer-events-none"></div>
            <div className="px-6 py-5 border-b border-indigo-50/50 flex justify-between items-center relative z-10">
                <h3 className="font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    Recent Appointments
                </h3>
                <Button size="sm" variant="outline" className="rounded-xl border-indigo-100 text-indigo-600 hover:bg-indigo-50 font-bold text-xs uppercase tracking-wide">View All</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left relative z-10">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <th className="px-6 py-3 font-medium">Client</th>
                            <th className="px-6 py-3 font-medium">Service</th>
                            <th className="px-6 py-3 font-medium">Date & Time</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {appointments.map(apt => (
                            <tr key={apt.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{apt.clientName}</div>
                                    <div className="text-xs text-gray-500">{apt.clientEmail}</div>
                                </td>
                                {/* TODO: Lookup service name from ID or pass full object */}
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {apt.serviceId === 's2' ? 'Standard Haircut' :
                                        apt.serviceId === 's3' ? 'Deep Tissue Massage' : 'Service'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{apt.date} at {apt.timeSlot}</td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={apt.status} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {apt.status === 'CONFIRMED' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                            onClick={async () => {
                                                if (!confirm('Cancel this appointment?')) return;
                                                // In a real app we would pass a handler, but for MVP we direct call service
                                                // verifying we are in a client component
                                                try {
                                                    const { cancelAppointment } = await import('@/services/dataService');
                                                    await cancelAppointment(apt.id);
                                                    window.location.reload(); // Simple refresh to show update
                                                } catch (e) {
                                                    alert('Failed to cancel');
                                                }
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
