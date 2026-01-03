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
        <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
                        {isStaffView ? 'My Roster' : 'Client Intelligence'}
                    </h1>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        {clients.length} Registered Profiles
                    </p>
                </div>

                {/* Search */}
                <div className="flex items-center gap-4">
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Identify client..."
                            className="w-full pl-11 pr-4 py-3 bg-gray-100/80 border border-transparent rounded-[20px] text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Client Table */}
            <div className="flex-1 bg-white border border-gray-100 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
                {filteredClients.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                        <div className="w-16 h-16 mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                            <UserIcon className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-1">No profiles found</h3>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto">
                            {searchQuery ? 'Adjust identifiers and try search again' : 'Client activity will populate this database'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-50 overflow-y-auto">
                            {filteredClients.map((client) => {
                                const isVIP = client.totalSpend > 500;
                                const isNew = client.visits === 1;
                                return (
                                    <div key={client.id} className="p-6 space-y-4 active:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-sm font-black shadow-sm ${isVIP ? 'bg-gradient-to-br from-amber-200 to-yellow-400 text-yellow-950' : 'bg-gray-100 text-gray-500'}`}>
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900 flex items-center gap-2">
                                                        {client.name}
                                                        {isVIP && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                                                    </div>
                                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        {client.email || 'No credentials'}
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="p-2 text-gray-300">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Revenue</div>
                                                <div className="text-sm font-black text-gray-900">${client.totalSpend.toLocaleString()}</div>
                                            </div>
                                            <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Session Count</div>
                                                <div className="text-sm font-black text-gray-900">{client.visits} Visits</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                Last: {client.lastVisit !== '0' ? format(new Date(client.lastVisit), 'MMM d, yyyy') : '-'}
                                            </div>
                                            <div className="flex gap-2">
                                                {isVIP && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-amber-100">VIP</span>}
                                                {isNew && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-indigo-100">New</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-50 bg-gray-50/30">
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors group whitespace-nowrap" onClick={() => handleSort('name')}>
                                            <div className="flex items-center gap-2">Client Identity <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                        </th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors group text-right whitespace-nowrap" onClick={() => handleSort('lastVisit')}>
                                            <div className="flex items-center justify-end gap-2">Last Active <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                        </th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors group text-right whitespace-nowrap" onClick={() => handleSort('visits')}>
                                            <div className="flex items-center justify-end gap-2">Session Count <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                        </th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors group text-right whitespace-nowrap" onClick={() => handleSort('totalSpend')}>
                                            <div className="flex items-center justify-end gap-2">Gross Revenue <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                        </th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">
                                            Status
                                        </th>
                                        <th className="px-8 py-5 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredClients.map((client) => {
                                        const isVIP = client.totalSpend > 500; // Mock logic for VIP
                                        const isNew = client.visits === 1;

                                        return (
                                            <tr key={client.id} className="group hover:bg-indigo-50/20 transition-all cursor-pointer">
                                                {/* Client Profile */}
                                                <td className="px-8 py-5 whitespace-nowrap">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-sm font-black shadow-sm ${isVIP ? 'bg-gradient-to-br from-amber-200 to-yellow-400 text-yellow-950' : 'bg-gray-100 text-gray-500'
                                                            }`}>
                                                            {client.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                                                                {client.name}
                                                                {isVIP && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                                                            </div>
                                                            <div className="text-[10px] font-black text-gray-400 flex items-center gap-1.5 mt-1 uppercase tracking-widest">
                                                                <Mail className="w-3 h-3" />
                                                                {client.email || 'No credentials'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Last Visit */}
                                                <td className="px-8 py-5 text-right whitespace-nowrap">
                                                    <div className="text-sm font-black text-gray-900">
                                                        {client.lastVisit !== '0' ? format(new Date(client.lastVisit), 'MMM d, yyyy') : '-'}
                                                    </div>
                                                    <div className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">
                                                        {client.lastVisit !== '0' ? format(new Date(client.lastVisit), 'h:mm a') : ''}
                                                    </div>
                                                </td>

                                                {/* Visits */}
                                                <td className="px-8 py-5 text-right whitespace-nowrap">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-xl bg-gray-50 text-gray-900 text-[10px] font-black uppercase tracking-widest border border-gray-100">
                                                        {client.visits} Sessions
                                                    </span>
                                                </td>

                                                {/* Total Spend */}
                                                <td className="px-8 py-5 text-right whitespace-nowrap">
                                                    <div className="text-sm font-black text-gray-900">
                                                        ${client.totalSpend.toLocaleString()}
                                                    </div>
                                                </td>

                                                {/* Badges */}
                                                <td className="px-8 py-5 text-right whitespace-nowrap">
                                                    <div className="flex justify-end gap-2">
                                                        {isVIP && (
                                                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-amber-100">
                                                                VIP
                                                            </span>
                                                        )}
                                                        {isNew && (
                                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-indigo-100">
                                                                New
                                                            </span>
                                                        )}
                                                        {!isVIP && !isNew && (
                                                            <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[9px] font-black uppercase tracking-widest rounded-md border border-gray-100">
                                                                Steady
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-8 py-5 text-right whitespace-nowrap">
                                                    <button className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all">
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
