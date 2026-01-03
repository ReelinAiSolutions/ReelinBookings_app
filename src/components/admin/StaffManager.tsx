import React, { useState, useMemo } from 'react';
import { createStaff, deleteStaff, getAvailability, upsertAvailability, updateStaffServices, updateStaff, checkActiveAppointments } from '@/services/dataService';
import { Service, Staff } from '@/types';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Grid, List, Users2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/context/ToastContext';
import StaffCard from './StaffCard';
import StaffFormModal from './StaffFormModal';

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [modalSchedule, setModalSchedule] = useState<any[]>([]);
    const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Filter staff
    const filteredStaff = useMemo(() => {
        return staff.filter(member =>
            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [staff, searchQuery]);

    const handleSave = async (data: Partial<Staff>, avatarFile: File | null) => {
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

            // Handle avatar upload
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
                // Update existing
                await updateStaff(editingStaff.id, {
                    name: data.name,
                    role: data.role || '',
                    avatar: avatarUrl,
                    email: data.email
                }, orgId);
                toast('Team member updated successfully', 'success');
            } else {
                // Create new
                await createStaff({
                    name: data.name,
                    role: data.role || '',
                    avatar: avatarUrl,
                    email: data.email,
                    specialties: []
                }, orgId);
                toast('Team member added successfully', 'success');
            }

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

        // Load schedule
        setIsLoadingSchedule(true);
        try {
            const existing = await getAvailability(member.id);
            const merged = DEFAULT_SCHEDULE.map(def => {
                const found = existing.find((e: any) => e.dayOfWeek === def.dayOfWeek);
                return found ? { ...def, ...found } : { ...def };
            });
            setModalSchedule(merged);
        } catch (e) {
            console.error(e);
            setModalSchedule(DEFAULT_SCHEDULE);
        } finally {
            setIsLoadingSchedule(false);
        }

        setIsModalOpen(true);
    };

    const handleSchedule = async (member: Staff) => {
        if (readOnly) return;
        await handleEdit(member);
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
        } catch (e) {
            console.error(e);
            toast('Failed to save schedule', 'error');
            throw e;
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
            throw e;
        }
    };

    return (
        <div className="flex flex-col h-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
                        {readOnly ? 'Meet The Team' : 'Team Roster'}
                    </h1>
                </div>

                {/* Actions & Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                    {/* Search */}
                    <div className="relative group flex-1 lg:w-96">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-all" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search team..."
                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[24px] text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all outline-none shadow-sm"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="hidden lg:flex bg-gray-50 p-1.5 rounded-[24px] border border-gray-100 shadow-sm flex-1 sm:flex-none">
                            <button
                                onClick={() => setViewMode('grid')}
                                title="Grid View"
                                className={`flex-1 sm:p-2.5 p-3 rounded-xl transition-all duration-300 flex items-center justify-center ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                title="List View"
                                className={`flex-1 sm:p-2.5 p-3 rounded-xl transition-all duration-300 flex items-center justify-center ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

                        {!readOnly && (
                            <button
                                onClick={handleAddNew}
                                className="bg-gray-900 hover:bg-black text-white rounded-[24px] px-6 sm:px-8 py-4 font-black text-xs uppercase tracking-widest shadow-2xl shadow-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2 group flex-[2] sm:flex-none"
                            >
                                <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" strokeWidth={3} />
                                <span className="hidden xs:inline">Add Member</span>
                                <span className="xs:hidden">Add</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Team Grid/List */}
            <div className="flex-1">
                {filteredStaff.length === 0 ? (
                    <div className="h-96 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-gray-100 border-dashed">
                        <div className="w-16 h-16 mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                            <Users2 className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {searchQuery ? 'No members found' : 'No team members'}
                        </h3>
                        <p className="text-gray-500 mb-6 text-sm max-w-xs mx-auto">
                            {searchQuery
                                ? 'Try adjusting your search terms'
                                : 'Get started by adding your first team member to the roster'}
                        </p>
                        {!readOnly && !searchQuery && (
                            <Button onClick={handleAddNew} variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Team Member
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className={
                        viewMode === 'grid'
                            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                            : 'space-y-3'
                    }>
                        {filteredStaff.map((member) => (
                            <div key={member.id} className={readOnly ? "pointer-events-none" : ""}>
                                <StaffCard
                                    staff={member}
                                    services={services}
                                    onEdit={readOnly ? undefined : handleEdit}
                                    onSchedule={readOnly ? undefined : handleSchedule}
                                    onDelete={readOnly ? undefined : handleDelete}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Form Modal - Only render if not readOnly */}
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
        </div>
    );
}
