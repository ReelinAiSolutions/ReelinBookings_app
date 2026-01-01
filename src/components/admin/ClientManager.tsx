import React, { useState, useMemo } from 'react';
import { Appointment, Service } from '@/types';
import { Search, Mail, Calendar, DollarSign, User as UserIcon, ArrowUpDown, MoreHorizontal, Star } from 'lucide-react';
import { format } from 'date-fns';

interface ClientManagerProps {
    appointments: Appointment[];
    services: Service[];
    isStaffView?: boolean;
}

export default function ClientManager({ appointments, services, isStaffView = false }: ClientManagerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    // Derived Clients List
    const clients = useMemo(() => {
        const clientMap = new Map();

        appointments.forEach(apt => {
            if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW') return;

            const key = apt.clientEmail || apt.clientName || 'unknown';
            if (key === 'unknown') return;

            if (!clientMap.has(key)) {
                clientMap.set(key, {
                    id: key,
                    name: apt.clientName || 'Unknown Client',
                    email: apt.clientEmail || '',
                    lastVisit: '0',
                    visits: 0,
                    totalSpend: 0
                });
            }

            const client = clientMap.get(key);
            client.visits += 1;

            try {
                const dateStr = apt.date ? apt.date.split('T')[0] : new Date().toISOString().split('T')[0];
                const timeStr = apt.timeSlot || '00:00';
                const aptDate = new Date(`${dateStr}T${timeStr}`);

                if (!isNaN(aptDate.getTime()) && new Date(client.lastVisit).getTime() < aptDate.getTime()) {
                    client.lastVisit = aptDate.toISOString();
                }
            } catch (e) { }

            const service = services.find(s => s.id === apt.serviceId);
            if (service) {
                client.totalSpend += service.price;
            }
        });

        let result = Array.from(clientMap.values());

        // Sorting
        if (sortConfig) {
            result.sort((a, b) => {
                if (sortConfig.key === 'name') {
                    return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                }
                if (sortConfig.key === 'visits') {
                    return sortConfig.direction === 'asc' ? a.visits - b.visits : b.visits - a.visits;
                }
                if (sortConfig.key === 'totalSpend') {
                    return sortConfig.direction === 'asc' ? a.totalSpend - b.totalSpend : b.totalSpend - a.totalSpend;
                }
                if (sortConfig.key === 'lastVisit') {
                    return sortConfig.direction === 'asc'
                        ? new Date(a.lastVisit).getTime() - new Date(b.lastVisit).getTime()
                        : new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
                }
                return 0;
            });
        } else {
            // Default sort: Last Visit Descending
            result.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
        }

        return result;
    }, [appointments, services, sortConfig]);

    // Filter
    const filteredClients = useMemo(() => {
        return clients.filter(c =>
            (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [clients, searchQuery]);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        {isStaffView ? 'My Clients' : 'Client Database'}
                    </h2>
                    <p className="text-gray-500 font-medium mt-1">
                        {isStaffView ? 'People you have personally serviced' : 'Manage your client base and history'}
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
                            placeholder="Search name or email..."
                            className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none w-72 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Client Table */}
            <div className="flex-1 bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                {filteredClients.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                        <div className="w-16 h-16 mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                            <UserIcon className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No clients found</h3>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">
                            {searchQuery ? 'Try adjusting your search terms.' : 'As appointments are booked, clients will appear here.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-6 py-4 text-[11px] font-[900] text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 group whitespace-nowrap" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-1">Client <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" /></div>
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-[900] text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 group text-right whitespace-nowrap" onClick={() => handleSort('lastVisit')}>
                                        <div className="flex items-center justify-end gap-1">Last Visit <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" /></div>
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-[900] text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 group text-right whitespace-nowrap" onClick={() => handleSort('visits')}>
                                        <div className="flex items-center justify-end gap-1">Visits <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" /></div>
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-[900] text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 group text-right whitespace-nowrap" onClick={() => handleSort('totalSpend')}>
                                        <div className="flex items-center justify-end gap-1">Total Spend <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" /></div>
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-[900] text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredClients.map((client) => {
                                    const isVIP = client.totalSpend > 500; // Mock logic for VIP
                                    const isNew = client.visits === 1;

                                    return (
                                        <tr key={client.id} className="group hover:bg-blue-50/30 transition-colors cursor-pointer">
                                            {/* Client Profile */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${isVIP ? 'bg-gradient-to-br from-amber-200 to-yellow-400 text-yellow-900' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {client.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                                            {client.name}
                                                            {isVIP && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                                        </div>
                                                        <div className="text-xs font-medium text-gray-400 flex items-center gap-1.5 mt-0.5">
                                                            <Mail className="w-3 h-3" />
                                                            {client.email || 'No email'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Last Visit */}
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-700">
                                                    {client.lastVisit !== '0' ? format(new Date(client.lastVisit), 'MMM d, yyyy') : '-'}
                                                </div>
                                                <div className="text-xs font-medium text-gray-400 mt-0.5">
                                                    {client.lastVisit !== '0' ? format(new Date(client.lastVisit), 'h:mm a') : ''}
                                                </div>
                                            </td>

                                            {/* Visits */}
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold">
                                                    {client.visits}
                                                </span>
                                            </td>

                                            {/* Total Spend */}
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <div className="text-sm font-black text-gray-900">
                                                    ${client.totalSpend.toLocaleString()}
                                                </div>
                                            </td>

                                            {/* Badges */}
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <div className="flex justify-end gap-2">
                                                    {isVIP && (
                                                        <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-amber-100">
                                                            VIP
                                                        </span>
                                                    )}
                                                    {isNew && (
                                                        <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-green-100">
                                                            New
                                                        </span>
                                                    )}
                                                    {!isVIP && !isNew && (
                                                        <span className="px-2 py-1 bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-gray-100">
                                                            Regular
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <button className="p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
