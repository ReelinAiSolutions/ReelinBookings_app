import React, { useState, useMemo } from 'react';
import { createStaff, deleteStaff, getAvailability, upsertAvailability, updateStaffServices, updateStaff, checkActiveAppointments } from '@/services/dataService';
import { Service, Staff } from '@/types';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Grid, List } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/context/ToastContext';
import StaffCard from './StaffCard';
import StaffFormModal from './StaffFormModal';

interface StaffManagerProps {
    staff: Staff[];
    services: Service[];
    orgId: string;
    onRefresh: () => void;
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

export default function StaffManager({ staff, services, orgId, onRefresh }: StaffManagerProps) {
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
        // Same as edit but switch to schedule tab
        await handleEdit(member);
    };

    const handleDelete = async (member: Staff) => {
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
        setEditingStaff(null);
        setModalSchedule(DEFAULT_SCHEDULE);
        setIsModalOpen(true);
    };

    const handleSaveSchedule = async (schedule: any[]) => {
        if (!editingStaff) return;

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
        if (!editingStaff) return;

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">Team Management</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage your team members, schedules, and service assignments
                        </p>
                    </div>
                    <Button
                        onClick={handleAddNew}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Team Member
                    </Button>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="p-6 border-b border-gray-200 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search team members..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                </div>

                {/* View Toggle */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        {filteredStaff.length} {filteredStaff.length === 1 ? 'team member' : 'team members'}
                    </p>
                    <div className="hidden md:flex gap-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                                }`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                                }`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Team Grid/List */}
            <div className="p-6">
                {filteredStaff.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <Plus className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {searchQuery ? 'No team members found' : 'No team members yet'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery
                                ? 'Try adjusting your search'
                                : 'Get started by adding your first team member'}
                        </p>
                        {!searchQuery && (
                            <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700 text-white">
                                <Plus className="w-5 h-5 mr-2" />
                                Add Your First Team Member
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className={
                        viewMode === 'grid'
                            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                            : 'space-y-4'
                    }>
                        {filteredStaff.map((member) => (
                            <StaffCard
                                key={member.id}
                                staff={member}
                                services={services}
                                onEdit={handleEdit}
                                onSchedule={handleSchedule}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Form Modal */}
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
        </div>
    );
}
