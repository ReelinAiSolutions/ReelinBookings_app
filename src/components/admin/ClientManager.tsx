import React, { useState, useMemo } from 'react';
import { Appointment, Service } from '@/types';
import { Search, Mail, Calendar, DollarSign, User as UserIcon, ArrowUpDown, MoreHorizontal, Star, Phone, X, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface ClientManagerProps {
    appointments: Appointment[];
    services: Service[];
    isStaffView?: boolean;
}

export default function ClientManager({ appointments, services, isStaffView = false }: ClientManagerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [selectedClient, setSelectedClient] = useState<any | null>(null);

    // Derived Clients List
    const clients = useMemo(() => {
        const clientMap = new Map();

        appointments.forEach(apt => {
            // Filter out cancelled, no-show, and internal/blocked time
            if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW') return;

            const name = apt.clientName || 'Unknown Client';
            const email = apt.clientEmail || '';

            // Filter out Blocked Time and Internal System Users
            if (name === 'Blocked Time' || email.includes('@internal') || email.includes('blocked@')) return;

            const key = email || name; // Prefer email as unique ID

            if (!clientMap.has(key)) {
                clientMap.set(key, {
                    id: key,
                    name: name,
                    email: email,
                    phone: apt.clientPhone || '',
                    lastVisit: '0',
                    visits: 0,
                    totalSpend: 0,
                    history: [],
                    notes: []
                });
            }

            const client = clientMap.get(key);
            client.visits += 1;

            // Update Phone if available (prefer latest)
            if (apt.clientPhone) client.phone = apt.clientPhone;

            // Add to History
            const service = services.find(s => s.id === apt.serviceId);
            client.history.push({
                date: apt.date,
                time: apt.timeSlot,
                serviceName: service?.name || 'Unknown Service',
                price: service?.price || 0,
                status: apt.status,
                notes: apt.notes
            });

            // Collect Notes
            if (apt.notes) client.notes.push(apt.notes);

            try {
                const dateStr = apt.date ? apt.date.split('T')[0] : new Date().toISOString().split('T')[0];
                const timeStr = apt.timeSlot || '00:00';
                const aptDate = new Date(`${dateStr}T${timeStr}`);

                if (!isNaN(aptDate.getTime()) && new Date(client.lastVisit).getTime() < aptDate.getTime()) {
                    client.lastVisit = aptDate.toISOString();
                }
            } catch (e) { }

            if (service) {
                client.totalSpend += service.price;
            }
        });

        let result = Array.from(clientMap.values());

        // Sort by Last Visit Descending by default
        if (sortConfig) {
            result.sort((a, b) => {
                if (sortConfig.key === 'name') return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                if (sortConfig.key === 'visits') return sortConfig.direction === 'asc' ? a.visits - b.visits : b.visits - a.visits;
                if (sortConfig.key === 'totalSpend') return sortConfig.direction === 'asc' ? a.totalSpend - b.totalSpend : b.totalSpend - a.totalSpend;
                if (sortConfig.key === 'lastVisit') return sortConfig.direction === 'asc'
                    ? new Date(a.lastVisit).getTime() - new Date(b.lastVisit).getTime()
                    : new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
                return 0;
            });
        } else {
            result.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
        }

        return result;
    }, [appointments, services, sortConfig]);

    // ... (Filter logic remains same)
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

    // Helper to clean up display names
    const getDisplayName = (name: string) => {
        if (name.toLowerCase().includes('walk-in')) return 'Walk-in Client'; // Simplify Walk-ins
        return name;
    };

    // Helper to clean up emails
    const getDisplayEmail = (email: string) => {
        if (!email || email.includes('walkin-')) return 'No credentials'; // Hide generated walk-in emails
        return email;
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
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#d946ef] transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Identify client..."
                            className="w-full pl-11 pr-4 py-3 bg-gray-100/80 border border-transparent rounded-[20px] text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#A855F7]/10 focus:border-[#d946ef] transition-all outline-none shadow-sm"
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
                                const displayName = getDisplayName(client.name);
                                const displayEmail = getDisplayEmail(client.email);

                                return (
                                    <div
                                        key={client.id}
                                        onClick={() => setSelectedClient(client)}
                                        className="p-6 space-y-4 active:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {/* Premium Avatar */}
                                                <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-sm font-black shadow-indigo-100 shadow-lg ${isVIP ? 'bg-gradient-to-br from-amber-200 to-yellow-400 text-yellow-950' : 'bg-gradient-to-br from-[#A855F7] to-[#d946ef] text-white shadow-[#d946ef]/20'}`}>
                                                    {displayName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900 flex items-center gap-2 text-lg">
                                                        {displayName}
                                                        {isVIP && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                                                    </div>
                                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                        <span>{displayEmail}</span>
                                                        {client.phone && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                                <span className="text-gray-500">{client.phone}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
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
                                                {isNew && <span className="px-2 py-0.5 bg-[#F3E8FF] text-[#A855F7] text-[9px] font-black uppercase tracking-widest rounded-md border border-[#A855F7]/20">New</span>}
                                                {!isVIP && !isNew && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-black uppercase tracking-widest rounded-md border border-gray-200">Steady</span>}
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
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-[#d946ef] transition-colors group whitespace-nowrap" onClick={() => handleSort('name')}>
                                            <div className="flex items-center gap-2">Client Identity <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                        </th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-[#d946ef] transition-colors group text-right whitespace-nowrap" onClick={() => handleSort('lastVisit')}>
                                            <div className="flex items-center justify-end gap-2">Last Active <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                        </th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-[#d946ef] transition-colors group text-right whitespace-nowrap" onClick={() => handleSort('visits')}>
                                            <div className="flex items-center justify-end gap-2">Session Count <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                        </th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-[#d946ef] transition-colors group text-right whitespace-nowrap" onClick={() => handleSort('totalSpend')}>
                                            <div className="flex items-center justify-end gap-2">Gross Revenue <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                        </th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredClients.map((client) => {
                                        const isVIP = client.totalSpend > 500;
                                        const isNew = client.visits === 1;
                                        const displayName = getDisplayName(client.name);
                                        const displayEmail = getDisplayEmail(client.email);

                                        return (
                                            <tr
                                                key={client.id}
                                                onClick={() => setSelectedClient(client)}
                                                className="group hover:bg-[#A855F7]/5 transition-all cursor-pointer"
                                            >
                                                {/* Client Profile */}
                                                <td className="px-8 py-5 whitespace-nowrap">
                                                    <div className="flex items-center gap-4">
                                                        {/* Premium Avatars with Purple Gradient */}
                                                        <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-sm font-black shadow-sm group-hover:scale-110 transition-transform duration-300 ${isVIP ? 'bg-gradient-to-br from-amber-200 to-yellow-400 text-yellow-950' : 'bg-gradient-to-br from-[#A855F7] to-[#d946ef] text-white shadow-[#d946ef]/20'
                                                            }`}>
                                                            {displayName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-gray-900 group-hover:text-[#d946ef] transition-colors flex items-center gap-2 text-base">
                                                                {displayName}
                                                                {isVIP && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                                                            </div>
                                                            <div className="text-[10px] font-black text-gray-400 flex items-center gap-1.5 mt-1 uppercase tracking-widest">
                                                                <Mail className="w-3 h-3" />
                                                                {displayEmail}
                                                                {client.phone && (
                                                                    <span className="flex items-center gap-1.5 ml-2 text-gray-500">
                                                                        <Phone className="w-3 h-3" />
                                                                        {client.phone}
                                                                    </span>
                                                                )}
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
                                                            <span className="px-2 py-0.5 bg-[#F3E8FF] text-[#A855F7] text-[9px] font-black uppercase tracking-widest rounded-md border border-[#A855F7]/20">
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
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Client Profile Modal (Slide Over) */}
            {
                selectedClient && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm animate-in fade-in duration-300"
                            onClick={() => setSelectedClient(null)}
                        />

                        {/* Modal Content */}
                        <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                            {/* Header */}
                            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-2xl font-black shadow-lg ${selectedClient.totalSpend > 500 ? 'bg-gradient-to-br from-amber-200 to-yellow-400 text-yellow-950' : 'bg-gradient-to-br from-[#A855F7] to-[#d946ef] text-white shadow-[#d946ef]/20'}`}>
                                            {getDisplayName(selectedClient.name).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-gray-900">{getDisplayName(selectedClient.name)}</h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                {selectedClient.totalSpend > 500 && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-md">VIP Client</span>}
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-md">
                                                    {selectedClient.visits} Visits
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedClient(null)}
                                        className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors shadow-sm"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Contact Details */}
                                <div className="mt-8 space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                        <div className="p-2 bg-[#F3E8FF] text-[#A855F7] rounded-lg">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</div>
                                            <div className="text-sm font-bold text-gray-900">{getDisplayEmail(selectedClient.email)}</div>
                                        </div>
                                    </div>
                                    {selectedClient.phone && (
                                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                                <Phone className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</div>
                                                <div className="text-sm font-bold text-gray-900">{selectedClient.phone}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recent History */}
                            <div className="flex-1 overflow-y-auto p-8">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    Appointment History
                                </h3>

                                <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-100">
                                    {selectedClient.history.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((apt: any, idx: number) => (
                                        <div key={idx} className="relative z-10 pl-10 group">
                                            {/* Timeline Dot */}
                                            <div className="absolute left-0 top-1.5 w-10 h-10 flex items-center justify-center">
                                                <div className="w-3 h-3 rounded-full bg-[#F3E8FF] border-2 border-[#d946ef] group-hover:scale-125 transition-transform" />
                                            </div>

                                            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-xs font-black text-gray-900 uppercase tracking-wider">
                                                        {format(new Date(apt.date), 'MMMM d, yyyy')}
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${apt.status === 'COMPLETED' ? 'bg-green-50 text-green-600' :
                                                        apt.status === 'CANCELLED' ? 'bg-red-50 text-red-600' :
                                                            'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {apt.status}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-bold text-gray-800 mb-1">{apt.serviceName}</div>
                                                <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                                                    <span>{apt.time}</span>
                                                    <span className="font-bold text-gray-900">${apt.price}</span>
                                                </div>
                                                {apt.notes && (
                                                    <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-600 italic bg-gray-50/50 p-2 rounded-lg">
                                                        "{apt.notes}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Stats */}
                            <div className="p-6 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lifetime Value</div>
                                    <div className="text-xl font-black text-gray-900">${selectedClient.totalSpend.toLocaleString()}</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Sessions</div>
                                    <div className="text-xl font-black text-gray-900">{selectedClient.visits}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
