import React from 'react';
import { Appointment } from '@/types';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface TodayPanelProps {
    appointments: Appointment[];
    staff: any[]; // Add staff prop
}

export default function TodayPanel({ appointments, staff }: TodayPanelProps) {
    // ... (keep existing filter logic) ...

    // ... inside map ...
    const staffMember = staff.find(s => s.id === apt.staffId);

    return (
        <div key={apt.id} className="group flex gap-4 items-start">
            {/* ... keep time/status ... */}
            <div className="flex-1 pb-4">
                <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-gray-900">{apt.timeSlot}</span>
                    {/* ... keep status badge ... */}
                </div>
                <div className="text-sm text-gray-900 font-bold">{apt.clientName}</div>
                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                    {staffMember ? staffMember.name : 'Unassigned'}
                </div>
            </div>
        </div>
    )

    {/* Quick Stats Footer */ }
    <div className="bg-gray-50 border-t border-gray-100 p-4">
        <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{todaysAppointments.length}</div>
            <div className="text-xs text-gray-500 capitalize">Bookings</div>
        </div>
    </div>
        </div >
    );
}
