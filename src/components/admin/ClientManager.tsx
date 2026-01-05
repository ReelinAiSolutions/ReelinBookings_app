import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Appointment, Service } from '@/types';
import { Search, Filter, MoreVertical, Mail, Phone, Calendar, Clock, User as UserIcon, X, ChevronRight, Star, AlertCircle, Copy, Users, ChevronDown } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

interface ClientManagerProps {
    appointments: Appointment[];
    services: Service[];
    isStaffView?: boolean;
}

interface ClientProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    lastVisit: string;
    visits: number;
    totalSpend: number;
    history: any[];
    notes: string[];
    status: 'NEW' | 'STEADY' | 'INACTIVE';
    isDuplicate: boolean;
}

export default function ClientManager({ appointments, services, isStaffView = false }: ClientManagerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEW' | 'STEADY' | 'INACTIVE'>('ALL');
    const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);

    // Process Clients & Intelligence
    const clients = useMemo(() => {
        const clientMap = new Map<string, ClientProfile>();
        // const nameFrequency = new Map<string, number>(); // REMOVED: Name duplicates are often false positives
        const phoneFrequency = new Map<string, number>();

        // Index to lookup existing client ID by normalized name
        // This allows us to find a client even if the current appointment has no email
        const clientsByName = new Map<string, string>();

        appointments.forEach(apt => {
            if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW') return;

            const rawName = apt.clientName || 'Unknown Client';
            const email = apt.clientEmail || '';
            const phone = apt.clientPhone || '';
            const normalizedName = rawName.toLowerCase().trim();

            // Skip blocked/internal
            if (rawName === 'Blocked Time' || email.includes('@internal') || email.includes('blocked@')) return;

            // IDENTITY RESOLUTION
            // 1. Prefer Phone (Mobile-first unique ID, merges users who change emails)
            // 2. Prefer Email
            // 3. Fallback to unique entry if neither exists (prevents "John Smith" merging)

            const mainKey = phone || email || `unverified-${apt.id}`;

            if (!clientMap.has(mainKey)) {
                clientMap.set(mainKey, {
                    id: mainKey,
                    name: rawName,
                    email: email,
                    phone: phone,
                    lastVisit: '0',
                    visits: 0,
                    totalSpend: 0,
                    history: [],
                    notes: [],
                    status: 'STEADY', // Default
                    isDuplicate: false
                });
            }

            const client = clientMap.get(mainKey)!;

            // Merge / Enhance Data
            // If the client didn't have an email/phone before but this appt has one, save it.
            if (!client.email && email) client.email = email;
            if (!client.phone && phone) client.phone = phone;

            client.visits += 1;

            const service = services.find(s => s.id === apt.serviceId);
            if (service) client.totalSpend += service.price;

            // Update Last Visit
            try {
                const dateStr = apt.date;
                if (dateStr && (client.lastVisit === '0' || dateStr > client.lastVisit)) {
                    client.lastVisit = dateStr;
                }
            } catch (e) { }

            client.history.push({
                ...apt,
                serviceName: service?.name || 'Unknown Service',
                price: service?.price || 0
            });
        });

        // 2. Intelligence Processing
        const processedClients = Array.from(clientMap.values());
        const today = new Date();

        // Calculate Stats & Duplicate Detection
        // STRATEGY: Only flag duplicates if they share a PHONE NUMBER.
        processedClients.forEach(c => {
            if (c.phone) {
                const normalizedPhone = c.phone.replace(/\D/g, ''); // strip formatting
                // Only count valid-ish phones (avoid '555555' etc if possible, but >6 digits is a fair start)
                // Also ignore common placeholders if any
                if (normalizedPhone.length > 6) {
                    phoneFrequency.set(normalizedPhone, (phoneFrequency.get(normalizedPhone) || 0) + 1);
                }
            }
        });

        processedClients.forEach(client => {
            // Status Logic
            const daysSinceVisit = differenceInDays(today, parseISO(client.lastVisit));

            if (client.visits === 1) {
                client.status = 'NEW';
            } else if (daysSinceVisit > 90) {
                client.status = 'INACTIVE';
            } else {
                client.status = 'STEADY';
            }

            // Duplicate Logic: strict phone match only
            if (client.phone) {
                const normalized = client.phone.replace(/\D/g, '');
                if (normalized.length > 6 && (phoneFrequency.get(normalized) || 0) > 1) {
                    client.isDuplicate = true;
                }
            }
        });

        // Sort: Most Recent first
        return processedClients.sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
    }, [appointments, services]);

    // Filtering
    const filteredClients = useMemo(() => {
        return clients.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [clients, searchQuery, statusFilter]);

    // Helpers
    const getInitials = (name: string) => name.charAt(0).toUpperCase();

    // Determine Status Colors
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
            case 'STEADY': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
            case 'INACTIVE': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700 pt-8 px-4 sm:px-6 lg:px-0 lg:pt-0">
            {/* Header Section */}
            <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full mb-6">
                {/* Title Row */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-1">
                            {isStaffView ? 'My Clients' : 'Client Intelligence'}
                        </h1>
                        <p className="text-gray-500 font-medium text-sm flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {clients.length} Registered Profiles
                        </p>
                    </div>
                </div>

                {/* Controls Row */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search clients..."
                            className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none shadow-sm dark:text-white"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="appearance-none pl-4 pr-10 py-3.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-700 dark:text-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none shadow-sm cursor-pointer"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="NEW">New</option>
                            <option value="STEADY">Steady</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* CONTENT GRID */}
            <div className="flex-1 px-4 sm:px-8 py-6 overflow-y-auto">
                <div className="max-w-3xl mx-auto space-y-4">
                    {filteredClients.map(client => (
                        <div
                            key={client.id}
                            onClick={() => setSelectedClient(client)}
                            className="bg-white dark:bg-card p-5 rounded-[24px] hover:shadow-xl hover:shadow-purple-500/5 dark:shadow-none border border-gray-100 dark:border-white/5 transition-all cursor-pointer active:scale-[0.99]"
                        >
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#A855F7] to-[#d946ef] text-white flex items-center justify-center text-xl font-black shadow-lg shadow-purple-500/20">
                                        {getInitials(client.name)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                                            {client.name}
                                        </h3>
                                        <div className="text-xs font-medium text-gray-400 mt-1 truncate max-w-[200px]">
                                            {client.email || (client.phone ? client.phone : 'No credentials')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-2.5 py-1 rounded-[10px] text-[10px] font-black uppercase tracking-widest border ${getStatusColor(client.status)}`}>
                                        {client.status}
                                    </span>
                                    {client.isDuplicate && (
                                        <span className="px-2.5 py-1 rounded-[10px] text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 border border-gray-200 flex items-center gap-1">
                                            <Copy className="w-3 h-3" />
                                            Duplicate
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Metrics Row */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="!bg-white dark:!bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm relative z-10">
                                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Revenue</div>
                                    <div className="text-base font-black text-gray-900 dark:text-white">
                                        ${client.totalSpend.toLocaleString()}
                                    </div>
                                </div>
                                <div className="!bg-white dark:!bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm relative z-10">
                                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Session Count</div>
                                    <div className="text-base font-black text-gray-900 dark:text-white">
                                        {client.visits} Visits
                                    </div>
                                </div>
                            </div>

                            {/* Recency & Intelligence Footer */}
                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
                                    <Calendar className="w-4 h-4 text-gray-300" />
                                    <span>Last Booked: {client.lastVisit !== '0' ? format(parseISO(client.lastVisit), 'MMM d, yyyy') : 'Never'}</span>
                                </div>

                                {client.status === 'INACTIVE' && (
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                                        {differenceInDays(new Date(), parseISO(client.lastVisit))} days inactive
                                    </span>
                                )}
                                {client.status === 'NEW' && (
                                    <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-lg">
                                        1st Booking
                                    </span>
                                )}
                            </div>

                            {client.isDuplicate && (
                                <div className="mt-4 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 flex items-start gap-3">
                                    <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                        <strong className="text-gray-900 dark:text-white">Possible Duplicate.</strong> Another profile shares this phone number.
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {filteredClients.length === 0 && (
                        <div className="text-center py-20 opacity-50">
                            <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="font-bold">No clients found matching your filter</p>
                        </div>
                    )}
                </div>
            </div>

            {/* SLIDE-OVER MODAL */}
            {selectedClient && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex justify-end font-sans">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
                        onClick={() => setSelectedClient(null)}
                    />
                    <div className="relative w-full max-w-md bg-white dark:bg-[#1a1b1e] h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">{selectedClient.name}</h2>
                            <button onClick={() => setSelectedClient(null)} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Detailed stats or history reuse */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Contact</h3>
                                {selectedClient.email && (
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/5">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span className="font-bold text-sm dark:text-white">{selectedClient.email}</span>
                                    </div>
                                )}
                                {selectedClient.phone && (
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/5">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span className="font-bold text-sm dark:text-white">{selectedClient.phone}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">History</h3>
                                {selectedClient.history.map((h, i) => (
                                    <div key={i} className="p-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold dark:text-white">{h.serviceName}</span>
                                            <span className="font-black dark:text-white">${h.price}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 font-medium">
                                            {format(parseISO(h.date), 'MMM d, yyyy')} at {h.timeSlot}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
