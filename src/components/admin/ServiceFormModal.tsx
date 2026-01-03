import { createClient } from '@/lib/supabase';
import React, { useState, useEffect } from 'react';
import { Service } from '@/types';
import { X, Upload, Image as ImageIcon, DollarSign, Clock, Tag, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';


interface ServiceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Service>) => Promise<void>;
    editingService: Service | null;
    existingCategories: string[];
}


export default function ServiceFormModal({ isOpen, onClose, onSave, editingService, existingCategories = [] }: ServiceFormModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const supabase = createClient();

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        durationMinutes: '',
        description: '',
        category: '',
        categoryColor: '#3B82F6',
        imageUrl: '',
        isVisible: true,
        bufferTimeMinutes: '0',
        depositRequired: false,
        depositAmount: '0',
        cancellationHours: '24',
        maxCapacity: '1',
    });

    useEffect(() => {
        if (editingService) {
            setFormData({
                name: editingService.name,
                price: editingService.price.toString(),
                durationMinutes: editingService.durationMinutes.toString(),
                description: editingService.description || '',
                category: editingService.category || '',
                categoryColor: editingService.categoryColor || '#3B82F6',
                imageUrl: editingService.imageUrl || '',
                isVisible: editingService.isVisible !== false,
                bufferTimeMinutes: (editingService.bufferTimeMinutes || 0).toString(),
                depositRequired: editingService.depositRequired || false,
                depositAmount: (editingService.depositAmount || 0).toString(),
                cancellationHours: (editingService.cancellationHours || 24).toString(),
                maxCapacity: (editingService.maxCapacity || 1).toString(),
            });
            setImagePreview(editingService.imageUrl || '');
        } else {
            setFormData({
                name: '',
                price: '',
                durationMinutes: '',
                description: '',
                category: '',
                categoryColor: '#3B82F6',
                imageUrl: '',
                isVisible: true,
                bufferTimeMinutes: '0',
                depositRequired: false,
                depositAmount: '0',
                cancellationHours: '24',
                maxCapacity: '1',
            });
            setImagePreview('');
        }
    }, [editingService, isOpen]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create a preview URL
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
            setSelectedFile(file);

            // Clean up memory
            return () => URL.revokeObjectURL(objectUrl);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            let finalImageUrl = formData.imageUrl;

            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `service_${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('service-assets')
                    .upload(filePath, selectedFile);

                if (uploadError) throw uploadError;

                const { data: publicData } = supabase.storage
                    .from('service-assets')
                    .getPublicUrl(filePath);

                finalImageUrl = publicData.publicUrl;
            }

            await onSave({
                name: formData.name,
                price: parseFloat(formData.price),
                durationMinutes: parseInt(formData.durationMinutes),
                description: formData.description,
                category: formData.category,
                categoryColor: formData.categoryColor,
                imageUrl: finalImageUrl,
                isVisible: formData.isVisible,
                bufferTimeMinutes: parseInt(formData.bufferTimeMinutes),
                depositRequired: formData.depositRequired,
                depositAmount: parseFloat(formData.depositAmount),
                cancellationHours: parseInt(formData.cancellationHours),
                maxCapacity: parseInt(formData.maxCapacity),
            });
            onClose();
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save service. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 border border-white/20">
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                            {editingService ? 'Service Intelligence' : 'Craft New Service'}
                        </h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            {editingService ? 'Refine your offering' : 'Define your next specialty'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Service Asset
                        </label>
                        <div className="relative">
                            {imagePreview ? (
                                <div className="relative h-48 rounded-[24px] overflow-hidden border border-gray-100 group">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => {
                                                setImagePreview('');
                                                setFormData({ ...formData, imageUrl: '' });
                                            }}
                                            className="p-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all active:scale-95 shadow-xl"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center h-48 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[24px] cursor-pointer hover:border-[#A855F7] hover:bg-[#A855F7]/10 transition-all group">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                                        <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-[#A855F7] transition-colors" />
                                    </div>
                                    <span className="text-sm font-black text-gray-900 mt-4">Upload Display Photo</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">PNG, JPG • Max 5MB</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                Service Designation
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Signature Sculpt Cut"
                                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#A855F7]/10 focus:border-[#A855F7] transition-all outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    Price (USD)
                                </label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#A855F7]/10 focus:border-[#A855F7] transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                    <Clock className="w-3.5 h-3.5" />
                                    Duration (MIN)
                                </label>
                                <input
                                    type="number"
                                    value={formData.durationMinutes}
                                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                                    placeholder="30"
                                    min="1"
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#A855F7]/10 focus:border-[#A855F7] transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                Detailed Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Explain what makes this service unique..."
                                rows={3}
                                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#A855F7]/10 focus:border-[#A855F7] transition-all outline-none resize-none"
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                            <Tag className="w-3.5 h-3.5" />
                            Collection Group (Optional)
                        </label>

                        {/* Custom Input */}
                        <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => {
                                const newCategory = e.target.value;
                                // Auto-assign color if it's a new category
                                let color = formData.categoryColor;
                                if (newCategory && !existingCategories.includes(newCategory)) {
                                    const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#6366F1', '#F43F5E', '#14B8A6'];
                                    const hash = newCategory.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
                                    color = colors[Math.abs(hash) % colors.length];
                                }
                                setFormData({ ...formData, category: newCategory, categoryColor: color });
                            }}
                            placeholder="e.g. Consultations, Classes, VIP..."
                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#A855F7]/10 focus:border-[#A855F7] transition-all outline-none mb-4"
                        />

                        {/* Quick Select Chips */}
                        {existingCategories.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {existingCategories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => {
                                            // Find existing color mapping if possible, or keep inconsistent but working logic
                                            // Ideally backend should store category-color maps, but for now we re-hash or reuse current.
                                            // Simple Re-hash to ensure consistent feel for existing ones too if valid
                                            const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#6366F1', '#F43F5E', '#14B8A6'];
                                            const hash = cat.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
                                            const color = colors[Math.abs(hash) % colors.length];

                                            setFormData({ ...formData, category: cat, categoryColor: color });
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${formData.category === cat
                                            ? 'bg-indigo-50 text-[#A855F7] border-indigo-200'
                                            : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300 hover:text-gray-600'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                        <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            placeholder="Enter custom category label..."
                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#A855F7]/10 focus:border-[#A855F7] transition-all outline-none"
                        />
                    </div>

                    {/* Advanced Settings */}
                    <div className="space-y-6 pt-8 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                                <Tag className="w-4 h-4 text-gray-400" />
                            </div>
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Protocol & Controls</h3>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                            <div>
                                <label className="text-sm font-black text-gray-900">Online Visibility</label>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Show in booking widget</p>
                            </div>
                            <button
                                onClick={() => setFormData({ ...formData, isVisible: !formData.isVisible })}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#A855F7]/20 ${formData.isVisible ? 'bg-[#A855F7]' : 'bg-gray-200'
                                    }`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-all duration-200 ${formData.isVisible ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                    Buffer Time (MIN)
                                </label>
                                <input
                                    type="number"
                                    value={formData.bufferTimeMinutes}
                                    onChange={(e) => setFormData({ ...formData, bufferTimeMinutes: e.target.value })}
                                    min="0"
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#A855F7]/10 focus:border-[#A855F7] transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                    Slot Capacity
                                </label>
                                <input
                                    type="number"
                                    value={formData.maxCapacity}
                                    onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                                    min="1"
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#A855F7]/10 focus:border-[#A855F7] transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-center gap-3 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={formData.depositRequired}
                                    onChange={(e) => setFormData({ ...formData, depositRequired: e.target.checked })}
                                    className="w-5 h-5 text-[#A855F7] rounded-lg focus:ring-[#A855F7]/20 border-gray-300 transition-all"
                                />
                                <div className="flex-1">
                                    <span className="text-sm font-black text-gray-900 block group-hover:text-[#A855F7] transition-colors">Require Upfront Deposit</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secure bookings with pre-payment</span>
                                </div>
                            </label>

                            {formData.depositRequired && (
                                <div className="animate-in slide-in-from-top-2 duration-200">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                        Required Deposit ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.depositAmount}
                                        onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#A855F7]/10 focus:border-[#A855F7] transition-all outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-4 p-8 border-t border-gray-100 bg-gray-50/50 sticky bottom-0 z-20">
                    <button
                        onClick={onClose}
                        className="flex-1 h-14 bg-white border border-gray-200 text-gray-900 rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 h-14 bg-gray-900 hover:bg-black text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 transition-all active:scale-95 disabled:bg-gray-200 disabled:shadow-none"
                        disabled={isLoading || !formData.name || !formData.price || !formData.durationMinutes}
                    >
                        {isLoading ? 'Processing...' : (editingService ? 'Update Service' : 'Initialize Service')}
                    </button>
                </div>
            </div>
        </div>
    );
}
