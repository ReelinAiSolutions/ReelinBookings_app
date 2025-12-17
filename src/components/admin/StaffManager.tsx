import React, { useState, useEffect } from 'react';
import { createStaff, deleteStaff, getAvailability, upsertAvailability, updateStaffServices } from '@/services/dataService';
import { Service, Staff } from '@/types';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, X, Clock, ChevronDown, ChevronUp, Save, Scissors } from 'lucide-react';

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
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // New Staff Form
    const [newStaff, setNewStaff] = useState({ name: '', role: '', avatar: '' });

    // Expansion for Schedule Editing
    const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
    const [schedule, setSchedule] = useState<any[]>([]);

    // Services Expansion
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [allServices, setAllServices] = useState<any[]>([]);

    const handleCreate = async () => {
        setIsLoading(true);
        try {
            const created = await createStaff({ ...newStaff, specialties: [] }, orgId);
            setIsCreating(false);
            setNewStaff({ name: '', role: '', avatar: '' });
            onRefresh();
        } catch (e) {
            console.error(e);
            alert("Failed to add staff member");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will remove them from online booking.")) return;
        try {
            await deleteStaff(id, orgId);
            onRefresh();
        } catch (e) {
            console.error(e);
            alert("Failed to delete staff");
        }
    };

    const toggleExpand = async (staffId: string) => {
        if (expandedStaffId === staffId) {
            setExpandedStaffId(null);
            return;
        }

        setExpandedStaffId(staffId);
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
                // We need to fetch ALL services to show the checklist
                // Assuming services list is passed as prop or we fetch it here.
                // It is better to rely on parent passing it, but for now lets fetch or use passed logic.
                // Wait! StaffManagerProps needs 'services' passed down from AdminDashboard!
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
            alert("Schedule saved!");
            setExpandedStaffId(null);
        } catch (e) {
            console.error(e);
            alert("Error saving schedule");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Team & Schedules</h3>
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
                        placeholder="Role (e.g. Master Barber)"
                        value={newStaff.role}
                        onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                    />
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
                        <div className="p-4 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                    {member.avatar ? <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" /> : <span className="text-gray-500 font-bold">{member.name[0]}</span>}
                                </div>
                                <div>
                                    <h4 className="font-bold">{member.name}</h4>
                                    <p className="text-sm text-gray-500">{member.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => toggleExpand(member.id)}>
                                    <Clock className="w-4 h-4 mr-1" />
                                    {expandedStaffId === member.id ? 'Close Schedule' : 'Edit Schedule'}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDelete(member.id)}>
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        </div>

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

                        {/* Services Editor - We can combine or keep separate. Let's add it below schedule for now */}
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
                                            alert("Services updated!");
                                            onRefresh(); // Refresh to update parent state if needed
                                        } catch (e) {
                                            console.error(e);
                                            alert("Error updating services");
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
