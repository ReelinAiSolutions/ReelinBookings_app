import React, { useState, useMemo } from 'react';
import { Appointment, Service } from '@/types';
import { Search, Mail, Phone, Calendar, DollarSign, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';

interface ClientManagerProps {
    appointments: Appointment[];
    services: Service[];
    isStaffView?: boolean; // To subtly adjust UI if needed
}

export default function ClientManager({ appointments, services, isStaffView = false }: ClientManagerProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Derived Clients List
    const clients = useMemo(() => {
        const clientMap = new Map();

        appointments.forEach(apt => {
            if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW') return;

            // Key by email if available, otherwise name (fallback)
            const key = apt.clientEmail || apt.clientName || 'unknown';

            // Skip invalid entries
            if (key === 'unknown') return;

            if (!clientMap.has(key)) {
                clientMap.set(key, {
                    id: key,
                    name: apt.clientName || 'Unknown Client',
                    email: apt.clientEmail || '',
                    lastVisit: '0', // Timestamp string
                    visits: 0,
                    totalSpend: 0
                });
            }

            const client = clientMap.get(key);

            // Update Stats
            client.visits += 1;

            // Last Visit
            try {
                // Handle potential date/time format issues safely
                const dateStr = apt.date ? apt.date.split('T')[0] : new Date().toISOString().split('T')[0];
                const timeStr = apt.timeSlot || '00:00';
                const aptDate = new Date(`${dateStr}T${timeStr}`);

                if (!isNaN(aptDate.getTime()) && new Date(client.lastVisit).getTime() < aptDate.getTime()) {
                    client.lastVisit = aptDate.toISOString();
                }
            } catch (e) {
                // Ignore invalid dates
            }

            // Spend
            const service = services.find(s => s.id === apt.serviceId);
            if (service) {
                client.totalSpend += service.price;
            }
        });

        // Convert to array and sort by most recent visit
        return Array.from(clientMap.values()).sort((a, b) =>
            new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
        );
    }, [appointments, services]);

    // Filter
    const filteredClients = useMemo(() => {
        return clients.filter(c =>
            (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [clients, searchQuery]);

    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        {isStaffView ? 'My Clients' : 'Client Database'}
                    </h2>
                    <p className="text-gray-500 font-medium mt-1">
                        {isStaffView
                            ? 'People you have personally serviced'
                            : 'All clients across the organization'}
                    </p>
                </div>

                {/* Search */}
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search clients..."
                            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Client List */}
            <div className="flex-1">
                {filteredClients.length === 0 ? (
                    <div className="h-96 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-gray-100 border-dashed">
                        <div className="w-16 h-16 mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                            <UserIcon className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No clients found</h3>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">
                            {searchQuery ? 'Try adjusting your search terms.' : 'As appointments are booked, clients will appear here.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredClients.map((client) => (
                            <div key={client.id} className="group flex flex-col md:flex-row md:items-center p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-lg hover:border-primary-100 transition-all duration-200">
                                {/* Avatar & Name */}
                                <div className="flex items-center gap-4 flex-1 mb-4 md:mb-0">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-200">
                                        {client.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight">
                                            {client.name}
                                        </h3>
                                        {client.email && (
                                            <span className="flex items-center text-sm font-medium text-gray-400 mt-0.5">
                                                <Mail className="w-3.5 h-3.5 mr-1.5" />
                                                {client.email}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="flex items-center gap-2 md:gap-6 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                                    <div className="px-4 py-2 bg-gray-50 rounded-xl min-w-[120px]">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Visit</div>
                                        <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                            {client.lastVisit !== '0' ? format(new Date(client.lastVisit), 'MMM d, yyyy') : 'N/A'}
                                        </div>
                                    </div>

                                    <div className="px-4 py-2 bg-gray-50 rounded-xl min-w-[100px]">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Visits</div>
                                        <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                            {client.visits}
                                        </div>
                                    </div>

                                    <div className="px-4 py-2 bg-gray-50 rounded-xl min-w-[120px]">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Lifetime Value</div>
                                        <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                            <DollarSign className="w-3.5 h-3.5 text-green-500" />
                                            {client.totalSpend.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
