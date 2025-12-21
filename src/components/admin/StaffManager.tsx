import React, { useState, useEffect } from 'react';
import { createStaff, deleteStaff, getAvailability, upsertAvailability, updateStaffServices, updateStaff, checkActiveAppointments } from '@/services/dataService';
import { Service, Staff } from '@/types';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, X, Clock, ChevronDown, ChevronUp, Save, Scissors, User, Camera, Upload } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/context/ToastContext';

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
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null); // For Details Edit

    // New Staff Form
    const [newStaff, setNewStaff] = useState({ name: '', role: '', avatar: '', email: '' });

    // Edit Staff Form
    const [editForm, setEditForm] = useState({ name: '', role: '', avatar: '', email: '' });
    // ...


    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Expansion for Schedule Editing
    const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
    const [schedule, setSchedule] = useState<any[]>([]);

    // Services Expansion
    const [selectedServices, setSelectedServices] = useState<string[]>([]);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleCreate = async () => {
        if (!newStaff.name.trim()) return;

        // Duplicate Check
        const isDuplicate = staff.some(s => s.name.toLowerCase().trim() === newStaff.name.toLowerCase().trim());
        if (isDuplicate) {
            toast(`A staff member named "${newStaff.name}" already exists.`, 'error');
            return;
        }

        setIsLoading(true);
        try {
            const created = await createStaff({ ...newStaff, specialties: [] }, orgId);
            setIsCreating(false);
            setNewStaff({ name: '', role: '', avatar: '', email: '' });
            onRefresh();
            toast('Staff member added', 'success');
        } catch (e) {
            console.error(e);
            toast('Failed to add staff member', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // ...

    const handleUpdateDetails = async (id: string) => {
        // Duplicate Check (Excluding self)
        const isDuplicate = staff.some(s => s.id !== id && s.name.toLowerCase().trim() === editForm.name.toLowerCase().trim());
        if (isDuplicate) {
            toast(`A staff member named "${editForm.name}" already exists.`, 'error');
            return;
        }

        setIsLoading(true);
        try {
            let avatarUrl = editForm.avatar;

            // Handle File Upload
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${orgId}/staff/${id}-${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('org-assets')
                    .upload(fileName, avatarFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: publicData } = supabase.storage
                    .from('org-assets')
                    .getPublicUrl(fileName);

                avatarUrl = publicData.publicUrl;
            }

            await updateStaff(id, {
                name: editForm.name,
                role: editForm.role,
                avatar: avatarUrl,
                email: editForm.email
            }, orgId);

            setEditingStaffId(null);
            onRefresh();
            setEditingStaffId(null);
            onRefresh();
            toast('Staff details updated!', 'success');
        } catch (e) {
            console.error(e);
            toast('Failed to update staff details', 'error');
        } finally {
            setIsLoading(false);
        }
    };



    const startEditing = (member: Staff) => {
        setEditForm({
            name: member.name,
            role: member.role,
            avatar: member.avatar || '',
            email: member.email || ''
        });
        setPreviewUrl(member.avatar || null);
        setAvatarFile(null);
        setEditingStaffId(member.id);
        setExpandedStaffId(null);
    };

    const handleDelete = async (member: Staff) => {
        try {
            // 1. Check for active appointments
            const activeCount = await checkActiveAppointments('staff', member.id);
            if (activeCount > 0) {
                toast(`Cannot remove ${member.name}. They have ${activeCount} active appointment(s).`, 'error');
                return;
            }

            if (!confirm(`Are you sure you want to remove ${member.name}? This cannot be undone.`)) return;

            setIsLoading(true);
            await deleteStaff(member.id, orgId); // Pass orgId if needed by updated service signature, or dataService handles it? 
            // note: dataService deleteStaff signature is (id, orgId). The previous call was `deleteStaff(member.id)`. 
            // I need to verify if `orgId` allows being undefined or if checking dataService again...
            // Checking dataService: `export const deleteStaff = async (id: string, orgId: string)`
            // So previous code was MISSING orgId. I must pass `orgId`.

            toast('Staff member removed', 'success');
            onRefresh();
        } catch (e) {
            console.error(e);
            toast('Failed to remove staff member', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const toggleExpand = async (staffId: string) => {
        if (expandedStaffId === staffId) {
            setExpandedStaffId(null);
            return;
        }

        setExpandedStaffId(staffId);
        setEditingStaffId(null); // Close details edit if open
        setIsLoading(true);

        try {
            // 1. Get Schedule
            const existing = await getAvailability(staffId);
            const merged = DEFAULT_SCHEDULE.map(def => {
                const found = existing.find((e: any) => e.dayOfWeek === def.dayOfWeek);
                return found ? { ...def, ...found } : { ...def };
            });
            setSchedule(merged);

            // 2. Get Services
            const staffMember = staff.find(s => s.id === staffId);
            if (staffMember) {
                setSelectedServices(staffMember.specialties);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const updateScheduleItem = (index: number, field: string, value: any) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setSchedule(newSchedule);
    };

    const saveSchedule = async (staffId: string) => {
        setIsLoading(true);
        try {
            await upsertAvailability(schedule, staffId, orgId);
            await upsertAvailability(schedule, staffId, orgId);
            toast('Schedule saved!', 'success');
            setExpandedStaffId(null);
        } catch (e) {
            console.error(e);
            toast('Error saving schedule', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Team & Schedules (Updated)</h3>
                <Button size="sm" onClick={() => setIsCreating(true)}><Plus className="w-4 h-4 mr-1" /> Add Member</Button>
            </div>

            {isCreating && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-sm">New Team Member</h4>
                        <button onClick={() => setIsCreating(false)}><X className="w-4 h-4 text-gray-500" /></button>
                    </div>
                    <input
                        className="w-full p-2 rounded border"
                        placeholder="Name (e.g. Sarah Smith)"
                        value={newStaff.name}
                        onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                    />
                    <input
                        className="w-full p-2 rounded border"
                        placeholder="Email (Required for login)"
                        value={newStaff.email}
                        onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                    />

                    <input
                        className="w-full p-2 rounded border"
                        placeholder="Role (e.g. Master Barber)"
                        value={newStaff.role}
                        onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                    />
                    {/* Simplified avatar input for creation, can create then edit for upload */}
                    <input
                        className="w-full p-2 rounded border"
                        placeholder="Avatar URL (optional)"
                        value={newStaff.avatar}
                        onChange={e => setNewStaff({ ...newStaff, avatar: e.target.value })}
                    />
                    <Button
                        size="sm"
                        className="w-full bg-primary-600 text-white"
                        onClick={handleCreate}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Add Member'}
                    </Button>
                </div>
            )}

            <div className="space-y-4">
                {staff.map(member => (
                    <div key={member.id} className="border rounded-lg overflow-hidden">
                        <div className="p-4 flex flex-col sm:flex-row justify-between sm:items-center bg-white gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {member.avatar ? <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" /> : <span className="text-gray-500 font-bold">{member.name[0]}</span>}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{member.name}</h4>
                                    <p className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-0.5">{member.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Button size="sm" variant="outline" onClick={() => startEditing(member)} className="flex-1 sm:flex-none justify-center">
                                    <User className="w-4 h-4 sm:mr-1" />
                                    <span className="text-xs sm:text-sm">Details</span>
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => toggleExpand(member.id)} className="flex-1 sm:flex-none justify-center">
                                    <Clock className="w-4 h-4 sm:mr-1" />
                                    <span className="text-xs sm:text-sm">{expandedStaffId === member.id ? 'Close' : 'Schedule'}</span>
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDelete(member)} className="px-3">
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        </div>

                        {/* EDIT DETAILS FORM */}
                        {editingStaffId === member.id && (
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <h5 className="font-bold text-sm text-gray-700">Edit Staff Details</h5>
                                    <button onClick={() => setEditingStaffId(null)}><X className="w-4 h-4 text-gray-400" /></button>
                                </div>

                                <div className="flex items-start gap-6">
                                    {/* Avatar Upload */}
                                    <div className="flex-shrink-0 text-center">
                                        <div className="w-20 h-20 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center overflow-hidden relative group mx-auto mb-2">
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-8 h-8 text-gray-300" />
                                            )}
                                            <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                <Camera className="w-5 h-5 text-white" />
                                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500">Change Photo</p>
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Full Name</label>
                                            <input
                                                className="w-full p-2 rounded border border-gray-300 text-sm"
                                                value={editForm.name}
                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Email (Login)</label>
                                            <input
                                                className="w-full p-2 rounded border border-gray-300 text-sm"
                                                value={editForm.email}
                                                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Role / Title</label>
                                            <input
                                                className="w-full p-2 rounded border border-gray-300 text-sm"
                                                value={editForm.role}
                                                onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-2">
                                    <Button size="sm" variant="outline" onClick={() => setEditingStaffId(null)}>Cancel</Button>
                                    <Button size="sm" className="bg-primary-600 text-white" onClick={() => handleUpdateDetails(member.id)} disabled={isLoading}>
                                        {isLoading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Availability Editor */}
                        {expandedStaffId === member.id && (
                            <div className="p-4 bg-gray-50 border-t border-gray-100">
                                <h5 className="font-bold text-sm mb-3 text-gray-700">Set Weekly Hours</h5>
                                <div className="space-y-2">
                                    {schedule.map((day, idx) => (
                                        <div key={day.dayOfWeek} className="flex items-center gap-2 text-sm">
                                            <div className="w-24 font-medium">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={day.isWorking}
                                                        onChange={(e) => updateScheduleItem(idx, 'isWorking', e.target.checked)}
                                                        className="rounded text-primary-600"
                                                    />
                                                    {day.dayName}
                                                </label>
                                            </div>
                                            {day.isWorking ? (
                                                <>
                                                    <input
                                                        type="time"
                                                        value={day.startTime}
                                                        onChange={(e) => updateScheduleItem(idx, 'startTime', e.target.value)}
                                                        className="p-1 border rounded w-28"
                                                    />
                                                    <span className="text-gray-400">-</span>
                                                    <input
                                                        type="time"
                                                        value={day.endTime}
                                                        onChange={(e) => updateScheduleItem(idx, 'endTime', e.target.value)}
                                                        className="p-1 border rounded w-28"
                                                    />
                                                </>
                                            ) : (
                                                <span className="text-gray-400 italic ml-2">Day off</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button onClick={() => saveSchedule(member.id)} className="bg-green-600 text-white hover:bg-green-700">
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Schedule
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Services Editor */}
                        {expandedStaffId === member.id && (
                            <div className="p-4 bg-white border-t border-gray-100">
                                <h5 className="font-bold text-sm mb-3 text-gray-700 flex items-center gap-2">
                                    <Scissors className="w-4 h-4" /> Services Provided
                                </h5>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {services.map(service => (
                                        <label key={service.id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedServices.includes(service.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedServices(prev => [...prev, service.id]);
                                                    } else {
                                                        setSelectedServices(prev => prev.filter(id => id !== service.id));
                                                    }
                                                }}
                                                className="rounded text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm font-medium">{service.name}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={async () => {
                                        setIsLoading(true);
                                        try {
                                            await updateStaffServices(member.id, selectedServices);
                                            await updateStaffServices(member.id, selectedServices);
                                            toast('Services updated!', 'success');
                                            onRefresh(); // Refresh to update parent state if needed
                                        } catch (e) {
                                            console.error(e);
                                            toast('Error updating services', 'error');
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }} size="sm" variant="outline">
                                        Save Services
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
