import { createClient } from '@/lib/supabase';
import React, { useState, useMemo, useEffect } from 'react';
import { createStaff, deleteStaff, getAvailability, upsertAvailability, updateStaffServices, updateStaff, checkActiveAppointments, getAppointments, getAllAvailability } from '@/services/dataService';
import { Service, Staff, Appointment, Availability } from '@/types';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Grid, List, Users2, Filter, ChevronDown, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import StaffCard from './StaffCard';
import StaffFormModal from './StaffFormModal';
import StaffScheduleViewer from './StaffScheduleViewer';
import { format, isSameDay, parseISO, startOfDay, endOfDay } from 'date-fns';

interface StaffManagerProps {
    staff: Staff[];
    services: Service[];
    orgId?: string; // Optional for read-only
    onRefresh?: () => void;
    readOnly?: boolean;
}

const DEFAULT_SCHEDULE = [
    { dayOfWeek: 1, dayName: 'Monday', startTime: '09:00', endTime: '17:00', isWorking: true },
    { dayOfWeek: 2, dayName: 'Tuesday', startTime: '09:00', endTime: '17:00', isWorking: true },
    { dayOfWeek: 3, dayName: 'Wednesday', startTime: '09:00', endTime: '17:00', isWorking: true },
    { dayOfWeek: 4, dayName: 'Thursday', startTime: '09:00', endTime: '17:00', isWorking: true },
    { dayOfWeek: 5, dayName: 'Friday', startTime: '09:00', endTime: '17:00', isWorking: true },
    { dayOfWeek: 6, dayName: 'Saturday', startTime: '10:00', endTime: '15:00', isWorking: true },
    { dayOfWeek: 0, dayName: 'Sunday', startTime: '10:00', endTime: '15:00', isWorking: false },
];

export default function StaffManager({ staff, services, orgId = '', onRefresh = () => { }, readOnly = false }: StaffManagerProps) {
    const { toast } = useToast();

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [modalSchedule, setModalSchedule] = useState<any[]>([]);

    // Viewer States
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [viewingStaff, setViewingStaff] = useState<Staff | null>(null);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [serviceFilter, setServiceFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Real-time Availability Data
    const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
    const [allAvailability, setAllAvailability] = useState<Availability[]>([]);
    const [loadingInsights, setLoadingInsights] = useState(false);

    const supabase = createClient();

    // Fetch Insights Data
    useEffect(() => {
        if (!orgId) return;
        const fetchInsights = async () => {
            setLoadingInsights(true);
            try {
                const avails = await getAllAvailability(orgId);
                // @ts-ignore
                setAllAvailability(Array.isArray(avails) ? avails : []);

                const apps = await getAppointments(orgId);
                const today = new Date();
                const todaysApps = apps.filter(app => isSameDay(parseISO(app.date), today) && app.status !== 'CANCELLED');
                setTodayAppointments(todaysApps);
            } catch (e) {
                console.error("Failed to fetch insights", e);
            } finally {
                setLoadingInsights(false);
            }
        };

        fetchInsights();
    }, [orgId, staff.length]);

    // Helper to calculate status
    const getStaffStatus = (staffId: string) => {
        if (loadingInsights) return { status: 'available', text: 'Updating...' } as const;

        const today = new Date();
        const currentDay = today.getDay(); // 0-6

        const userAvail = allAvailability.filter(a => a.staffId === staffId && a.dayOfWeek === currentDay);
        const todayRule = userAvail.find(a => a.dayOfWeek === currentDay);

        if (!todayRule || !todayRule.isWorking) {
            return { status: 'leave', text: 'Off Today' } as const;
        }

        const startHour = parseInt(todayRule.startTime.split(':')[0]);
        const endHour = parseInt(todayRule.endTime.split(':')[0]);
        const totalHours = endHour - startHour;
        const totalSlots = totalHours;

        const staffApps = todayAppointments.filter(a => a.staffId === staffId);
        const bookedCount = staffApps.length;

        const slotsLeft = Math.max(0, totalSlots - bookedCount);

        if (slotsLeft === 0) return { status: 'busy', text: 'Fully Booked' } as const;
        if (slotsLeft <= 2) return { status: 'limited', text: `${slotsLeft} slot${slotsLeft === 1 ? '' : 's'} left` } as const;

        return { status: 'available', text: `Available · ${slotsLeft} slots left` } as const;
    };

    // Filters...
    const availableRoles = useMemo(() => {
        const roles = new Set(staff.map(s => s.role).filter(Boolean));
        return Array.from(roles);
    }, [staff]);

    const filteredStaff = useMemo(() => {
        let result = staff.filter(member => {
            const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.email?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesRole = roleFilter === 'all' || member.role === roleFilter;

            const matchesService = serviceFilter === 'all' || (member.specialties && member.specialties.includes(serviceFilter));

            return matchesSearch && matchesRole && matchesService;
        });

        result.sort((a, b) => {
            return sortOrder === 'asc'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
        });

        return result;
    }, [staff, searchQuery, roleFilter, serviceFilter, sortOrder]);

    // Data Handlers
    const handleSave = async (data: Partial<Staff>, avatarFile?: File | null) => {
        if (readOnly) return;
        try {
            if (!data.name?.trim()) {
                toast('Name is required', 'error');
                return;
            }
            if (!data.email?.trim()) {
                toast('Email is required', 'error');
                return;
            }

            let avatarUrl = data.avatar || '';

            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${orgId}/staff/${editingStaff?.id || 'new'}-${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('org-assets')
                    .upload(fileName, avatarFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: publicData } = supabase.storage
                    .from('org-assets')
                    .getPublicUrl(fileName);

                avatarUrl = publicData.publicUrl;
            }

            if (editingStaff) {
                await updateStaff(editingStaff.id, {
                    name: data.name,
                    role: data.role || '',
                    avatar: avatarUrl,
                    email: data.email
                }, orgId);
                toast('Team member updated successfully', 'success');
            } else {
                await createStaff({
                    name: data.name,
                    role: data.role || '',
                    avatar: avatarUrl,
                    email: data.email,
                    specialties: []
                }, orgId);
                toast('Team member added successfully', 'success');
            }

            // Don't close modal here, allow them to continue editing tabs if they want? 
            // Actually usually save closes modal.
            setIsModalOpen(false);
            setEditingStaff(null);
            onRefresh();
        } catch (e) {
            console.error(e);
            toast('Failed to save team member', 'error');
        }
    };

    const handleEdit = async (member: Staff) => {
        if (readOnly) return;
        setEditingStaff(member);
        setIsModalOpen(true);
        try {
            // We fetch availability specifically for editing to ensure we have latest for this user
            const existing = await getAvailability(member.id);
            const merged = DEFAULT_SCHEDULE.map(def => {
                const found = existing.find((e: any) => e.dayOfWeek === def.dayOfWeek);
                return found ? { ...def, ...found } : { ...def };
            });
            setModalSchedule(merged);
        } catch (e) {
            setModalSchedule(DEFAULT_SCHEDULE);
        }
    };

    const handleSchedule = async (member: Staff) => {
        // VIEW ONLY Schedule
        setViewingStaff(member);
        setIsViewerOpen(true);
    };

    const handleDelete = async (member: Staff) => {
        if (readOnly) return;
        if (!confirm(`Are you sure you want to remove ${member.name} from your team?`)) return;

        try {
            const activeCount = await checkActiveAppointments('staff', member.id);
            if (activeCount > 0) {
                toast(`Cannot remove ${member.name}. They have ${activeCount} active appointment(s).`, 'error');
                return;
            }

            await deleteStaff(member.id, orgId);
            onRefresh();
            toast('Team member removed', 'success');
        } catch (e) {
            console.error(e);
            toast('Failed to remove team member', 'error');
        }
    };

    const handleAddNew = () => {
        if (readOnly) return;
        setEditingStaff(null);
        setModalSchedule(DEFAULT_SCHEDULE);
        setIsModalOpen(true);
    };

    const handleSaveSchedule = async (schedule: any[]) => {
        if (readOnly || !editingStaff) return;
        try {
            await upsertAvailability(schedule, editingStaff.id, orgId);
            toast('Schedule saved successfully', 'success');
            // Update local availability state to reflect changes immediately
            const avails = await getAllAvailability(orgId);
            // @ts-ignore
            setAllAvailability(Array.isArray(avails) ? avails : []);
        } catch (e) {
            console.error(e);
            toast('Failed to save schedule', 'error');
        }
    };

    const handleSaveServices = async (serviceIds: string[]) => {
        if (readOnly || !editingStaff) return;
        try {
            await updateStaffServices(editingStaff.id, serviceIds);
            toast('Services updated successfully', 'success');
            onRefresh();
        } catch (e) {
            console.error(e);
            toast('Failed to update services', 'error');
        }
    };

    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-8 px-4 sm:px-6 lg:px-0 lg:pt-0">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                        {readOnly ? 'Meet The Team' : 'Team Roster'}
                    </h1>
                    <p className="text-gray-500 font-medium">Manage your staff, roles, and schedules.</p>
                </div>

                {/* Actions & Filters */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full xl:w-auto">
                    {/* Search */}
                    <div className="relative group flex-1 min-w-[200px] xl:w-80">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search staff..."
                            className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none shadow-sm dark:text-white"
                        />
                    </div>

                    {/* Filter: Role */}
                    <div className="relative">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="appearance-none w-full sm:w-auto pl-4 pr-10 py-3.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none cursor-pointer"
                        >
                            <option value="all">All Roles</option>
                            {availableRoles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Filter: Service */}
                    <div className="relative">
                        <select
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value)}
                            className="appearance-none w-full sm:w-auto pl-4 pr-10 py-3.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none cursor-pointer"
                        >
                            <option value="all">All Services</option>
                            {services.map(service => (
                                <option key={service.id} value={service.id}>{service.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Sort */}
                    <button
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm"
                        title="Toggle Sort Order"
                        style={{ backgroundColor: '#ffffff' }}
                    >
                        <ArrowUpDown className="w-4 h-4" />
                        <span className="hidden sm:inline">{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
                    </button>

                    {!readOnly && (
                        <button
                            onClick={handleAddNew}
                            className="bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-200 text-white dark:text-black rounded-2xl px-6 py-3.5 font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-200/50 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 group whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" strokeWidth={3} />
                            <span>Add Member</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Team Grid */}
            <div className="flex-1 pb-24">
                {filteredStaff.length === 0 ? (
                    <div className="h-96 flex flex-col items-center justify-center text-center bg-white dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/5 border-dashed">
                        <div className="w-20 h-20 mb-6 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center">
                            <Users2 className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                            {searchQuery ? 'No members match filters' : 'No team members found'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto font-medium">
                            {searchQuery
                                ? 'Try adjusting your search or filters'
                                : 'Get started by adding your first team member'}
                        </p>
                        {!readOnly && !searchQuery && (
                            <Button onClick={handleAddNew} variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Team Member
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredStaff.map((member) => {
                            const { status, text } = getStaffStatus(member.id);
                            return (
                                <StaffCard
                                    key={member.id}
                                    staff={member}
                                    services={services}
                                    onEdit={readOnly ? undefined : handleEdit}
                                    onSchedule={handleSchedule} // Allow simple viewing even in readOnly? Yes.
                                    onDelete={readOnly ? undefined : handleDelete}
                                    status={status}
                                    statusDetails={text}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {!readOnly && (
                <StaffFormModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingStaff(null);
                    }}
                    onSave={handleSave}
                    editingStaff={editingStaff}
                    services={services}
                    onSaveSchedule={handleSaveSchedule}
                    onSaveServices={handleSaveServices}
                    initialSchedule={modalSchedule}
                />
            )}

            {/* Schedule Viewer Modal */}
            {viewingStaff && (
                <StaffScheduleViewer
                    isOpen={isViewerOpen}
                    onClose={() => {
                        setIsViewerOpen(false);
                        setViewingStaff(null);
                    }}
                    staff={viewingStaff}
                    availability={allAvailability.filter(a => a.staffId === viewingStaff.id)}
                />
            )}
        </div>
    );
}
