import React from 'react';
import { Appointment } from '@/types';
import { Button } from '@/components/ui/Button';

interface AppointmentListProps {
    appointments: Appointment[];
}

export default function AppointmentList({ appointments }: AppointmentListProps) {
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
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {apt.status.toLowerCase()}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
