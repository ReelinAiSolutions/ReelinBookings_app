import React, { useState } from 'react';
import { Staff } from '@/types';
import { Button } from '@/components/ui/Button';
import { X, Lock, Check } from 'lucide-react';

interface BlockModalProps {
    isOpen: boolean;
    date: Date | null;
    time: string | null;
    staff: Staff[];
    onClose: () => void;
    onConfirm: (staffId: string, note: string, durationMinutes: number) => Promise<void>;
}

export default function BlockModal({ isOpen, date, time, staff, onClose, onConfirm }: BlockModalProps) {
    const [selectedStaffId, setSelectedStaffId] = useState(staff[0]?.id || '');
    const [note, setNote] = useState('');
    const [duration, setDuration] = useState(60);
    const [isLoading, setIsLoading] = useState(false);

    // Update default staff when staff list loads
    React.useEffect(() => {
        if (staff.length > 0 && !selectedStaffId) {
            setSelectedStaffId(staff[0].id);
        }
    }, [staff, selectedStaffId]);

    if (!isOpen || !date || !time) return null;

    const handleConfirm = async () => {
        if (!selectedStaffId) {
            alert('Please select a staff member to block.');
            return;
        }
        setIsLoading(true);
        try {
            await onConfirm(selectedStaffId, note || 'Busy', duration);
            setNote(''); // Reset
            setDuration(60);
            onClose();
        } catch (error) {
            alert('Failed to block time: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-gray-700" />
                        <h3 className="font-bold text-lg text-gray-900">Block Time</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="text-center mb-2">
                        <p className="text-sm text-gray-500">Blocking slot for</p>
                        <p className="text-lg font-bold text-gray-900">{date.toDateString()} at {time}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
                        <select
                            value={selectedStaffId}
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            {staff.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                        <div className="flex flex-wrap gap-2">
                            {[15, 20, 30, 45, 60, 90].map(dur => (
                                <button
                                    key={dur}
                                    onClick={() => setDuration(dur)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${duration === dur
                                        ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {dur}m
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. Lunch, Meeting"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={isLoading} className="bg-gray-900 hover:bg-black text-white">
                        {isLoading ? 'Blocking...' : 'Confirm Block'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
