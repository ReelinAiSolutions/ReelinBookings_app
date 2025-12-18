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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Recent Appointments</h3>
                <Button size="sm" variant="outline">View All</Button>
            </div>
            <table className="w-full text-left">
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
    );
}
