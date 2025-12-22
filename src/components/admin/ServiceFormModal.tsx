import React, { useState, useEffect } from 'react';
import { Service } from '@/types';
import { X, Upload, Image as ImageIcon, DollarSign, Clock, Tag, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createBrowserClient } from '@supabase/ssr';

interface ServiceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Service>) => Promise<void>;
    editingService: Service | null;
}

const CATEGORY_PRESETS = [
    { name: 'Haircuts', color: '#3B82F6' },
    { name: 'Coloring', color: '#8B5CF6' },
    { name: 'Treatments', color: '#10B981' },
    { name: 'Styling', color: '#F59E0B' },
    { name: 'Consultations', color: '#EC4899' },
    { name: 'Packages', color: '#6366F1' },
];

export default function ServiceFormModal({ isOpen, onClose, onSave, editingService }: ServiceFormModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {editingService ? 'Edit Service' : 'New Service'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Service Photo
                        </label>
                        <div className="relative">
                            {imagePreview ? (
                                <div className="relative h-48 rounded-xl overflow-hidden border-2 border-gray-200">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => {
                                            setImagePreview('');
                                            setFormData({ ...formData, imageUrl: '' });
                                        }}
                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all">
                                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                                    <span className="text-sm font-medium text-gray-600">Click to upload image</span>
                                    <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
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
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Service Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Men's Haircut"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <DollarSign className="w-4 h-4 inline mr-1" />
                                    Price *
                                </label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Clock className="w-4 h-4 inline mr-1" />
                                    Duration (min) *
                                </label>
                                <input
                                    type="number"
                                    value={formData.durationMinutes}
                                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                                    placeholder="30"
                                    min="1"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe your service..."
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Tag className="w-4 h-4 inline mr-1" />
                            Category
                        </label>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {CATEGORY_PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => setFormData({ ...formData, category: preset.name, categoryColor: preset.color })}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${formData.category === preset.name
                                        ? 'ring-2 ring-offset-2'
                                        : 'hover:bg-gray-100'
                                        }`}
                                    style={{
                                        backgroundColor: formData.category === preset.name ? `${preset.color}20` : 'transparent',
                                        color: preset.color,
                                        ringColor: preset.color,
                                    }}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            placeholder="Or enter custom category"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Advanced Settings */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Advanced Settings</h3>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-semibold text-gray-700">Online Visibility</label>
                                <p className="text-xs text-gray-500">Show this service in booking widget</p>
                            </div>
                            <button
                                onClick={() => setFormData({ ...formData, isVisible: !formData.isVisible })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isVisible ? 'bg-blue-600' : 'bg-gray-300'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isVisible ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Buffer Time (min)
                                </label>
                                <input
                                    type="number"
                                    value={formData.bufferTimeMinutes}
                                    onChange={(e) => setFormData({ ...formData, bufferTimeMinutes: e.target.value })}
                                    min="0"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Max Capacity
                                </label>
                                <input
                                    type="number"
                                    value={formData.maxCapacity}
                                    onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                                    min="1"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={formData.depositRequired}
                                onChange={(e) => setFormData({ ...formData, depositRequired: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <label className="text-sm font-semibold text-gray-700">Require Deposit</label>
                        </div>

                        {formData.depositRequired && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Deposit Amount ($)
                                </label>
                                <input
                                    type="number"
                                    value={formData.depositAmount}
                                    onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={isLoading || !formData.name || !formData.price || !formData.durationMinutes}
                    >
                        {isLoading ? 'Saving...' : 'Save Service'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
