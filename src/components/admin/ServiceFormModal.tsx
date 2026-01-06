import { createClient } from '@/lib/supabase';
import React, { useState, useEffect } from 'react';
import { Service } from '@/types';
import { X, Upload, Image as ImageIcon, DollarSign, Clock, Tag, Eye, EyeOff, Plus, Trash2, ListPlus, HelpCircle } from 'lucide-react';
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
        durationMinutes: '30',
        description: '',
        category: '',
        categoryColor: '#3B82F6',
        imageUrl: '',
        isVisible: true,
        bufferTimeMinutes: '0',
        maxCapacity: '1',
        intakeQuestions: [] as any[]
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
                isVisible: editingService.isVisible ?? true,
                bufferTimeMinutes: (editingService.bufferTimeMinutes || 0).toString(),
                maxCapacity: (editingService.maxCapacity || 1).toString(),
                intakeQuestions: Array.isArray(editingService.intakeQuestions) ? editingService.intakeQuestions : []
            });
            setImagePreview(editingService.imageUrl || '');
        } else {
            setFormData({
                name: '',
                price: '',
                durationMinutes: '30',
                description: '',
                category: '',
                categoryColor: '#3B82F6',
                imageUrl: '',
                isVisible: true,
                bufferTimeMinutes: '0',
                maxCapacity: '1',
                intakeQuestions: []
            });
            setImagePreview('');
        }
    }, [editingService, isOpen]);

    // Mobile-friendly image compression
    const compressImage = async (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const maxWidth = 1200;
            const maxHeight = 1200;
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height *= maxWidth / width));
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width *= maxHeight / height));
                            height = maxHeight;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Canvas is empty'));
                            return;
                        }
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    }, 'image/jpeg', 0.8);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsLoading(true); // Show loading while compressing
            try {
                // Compress if larger than 500KB or strictly if larger than 1MB
                let fileToProcess = file;
                if (file.size > 500 * 1024) {
                    console.log(`original size: ${file.size}`);
                    fileToProcess = await compressImage(file);
                    console.log(`compressed size: ${fileToProcess.size}`);
                }

                // Create a preview URL
                const objectUrl = URL.createObjectURL(fileToProcess);
                setImagePreview(objectUrl);
                setSelectedFile(fileToProcess);

                // Clean up memory
                return () => URL.revokeObjectURL(objectUrl);
            } catch (err) {
                console.error("Compression failed", err);
                alert("Failed to process image. Please try a different photo.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const addQuestion = () => {
        const newQuestion = {
            id: Math.random().toString(36).substr(2, 9),
            label: '',
            type: 'text' as const,
            required: false
        };
        setFormData({
            ...formData,
            intakeQuestions: [...formData.intakeQuestions, newQuestion]
        });
    };

    const removeQuestion = (id: string) => {
        setFormData({
            ...formData,
            intakeQuestions: formData.intakeQuestions.filter(q => q.id !== id)
        });
    };

    const updateQuestion = (id: string, updates: any) => {
        setFormData({
            ...formData,
            intakeQuestions: formData.intakeQuestions.map(q => q.id === id ? { ...q, ...updates } : q)
        });
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
                bufferTimeMinutes: parseInt(formData.bufferTimeMinutes.toString()),
                maxCapacity: parseInt(formData.maxCapacity.toString()),
                intakeQuestions: formData.intakeQuestions.filter(q => q.label.trim())
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-gray-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-card rounded-t-[2rem] rounded-b-[2rem] sm:rounded-[2rem] shadow-2xl w-full max-w-2xl h-[85vh] sm:h-auto sm:max-h-[90vh] mb-20 sm:mb-0 overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:zoom-in-95 sm:slide-in-from-bottom-8 duration-300 border border-white/20 dark:border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-gray-100 dark:border-white/10 bg-white/80 dark:bg-card/80 backdrop-blur-xl sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
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
                                <label className="flex flex-col items-center justify-center h-48 bg-gray-50/50 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[24px] cursor-pointer hover:border-[var(--primary-600)] dark:hover:border-[var(--primary-600)] hover:bg-[var(--primary-600)]/10 dark:hover:bg-[var(--primary-600)]/10 transition-all group">
                                    <div className="p-4 bg-white dark:bg-white/10 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 group-hover:scale-110 transition-transform duration-300">
                                        <ImageIcon className="w-8 h-8 text-gray-400 dark:text-white group-hover:text-[var(--primary-600)] transition-colors" />
                                    </div>
                                    <span className="text-sm font-black text-gray-900 dark:text-white mt-4">Upload Display Photo</span>
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
                                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-[var(--primary-600)]/10 focus:border-[var(--primary-600)] transition-all outline-none dark:text-white"
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
                                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-[var(--primary-600)]/10 focus:border-[var(--primary-600)] transition-all outline-none dark:text-white"
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
                                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-[var(--primary-600)]/10 focus:border-[var(--primary-600)] transition-all outline-none dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                Detailed Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="What's included in this service?"
                                rows={3}
                                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-[var(--primary-600)]/10 focus:border-[var(--primary-600)] transition-all outline-none resize-none dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Intake Questions Editor (Moved up for better visibility) */}
                    <div className="pt-8 border-t border-gray-100 dark:border-white/10 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-primary-900/20 flex items-center justify-center">
                                    <HelpCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Intake Questionnaire</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Structured data for this service</p>
                                </div>
                            </div>
                            <Button
                                onClick={addQuestion}
                                type="button"
                                className="bg-purple-50 dark:bg-primary-900/20 text-[var(--primary-600)] dark:text-primary-400 hover:bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 border-none shadow-none text-[10px] font-black h-8 px-3 rounded-lg flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Question
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {formData.intakeQuestions.length === 0 ? (
                                <div className="p-8 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[24px] text-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No custom intake questions</p>
                                    <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-1">Clients will see the standard 'Special Notes' field by default.</p>
                                </div>
                            ) : (
                                formData.intakeQuestions.map((q: any) => (
                                    <div key={q.id} className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl animate-in slide-in-from-top-2 duration-200">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1 space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Question Label</label>
                                                        <input
                                                            type="text"
                                                            value={q.label}
                                                            onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                                                            placeholder="e.g. Skin Allergies?"
                                                            className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[var(--primary-600)]/10 outline-none dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Input Type</label>
                                                        <select
                                                            value={q.type}
                                                            onChange={(e) => updateQuestion(q.id, { type: e.target.value })}
                                                            className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[var(--primary-600)]/10 outline-none dark:text-white"
                                                        >
                                                            <option value="text">Short Answer</option>
                                                            <option value="longtext">Long Answer</option>
                                                            <option value="checkbox">Checkbox (Yes/No)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <label className="flex items-center gap-2 cursor-pointer group w-fit">
                                                    <input
                                                        type="checkbox"
                                                        checked={q.required}
                                                        onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                                                        className="w-4 h-4 text-[var(--primary-600)] rounded focus:ring-[var(--primary-600)]/20 border-gray-300"
                                                    />
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-700 transition-colors">Required Field</span>
                                                </label>
                                            </div>
                                            <button
                                                onClick={() => removeQuestion(q.id)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
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
                            className="w-full px-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-[var(--primary-600)]/10 focus:border-[var(--primary-600)] transition-all outline-none mb-4 dark:text-white"
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
                                            ? 'bg-primary-50 dark:bg-primary-900/20 text-[var(--primary-600)] dark:text-primary-400 border-primary-200 dark:border-primary-500/20'
                                            : 'bg-white dark:bg-white/5 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-600 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Protocol & Controls */}
                    <div className="pt-8 border-t border-gray-100 dark:border-white/10 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                                <Tag className="w-4 h-4 text-gray-400" />
                            </div>
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Protocol & Controls</h3>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl">
                            <div>
                                <label className="text-sm font-black text-gray-900 dark:text-white">Online Visibility</label>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Show in booking widget</p>
                            </div>
                            <button
                                onClick={() => setFormData({ ...formData, isVisible: !formData.isVisible })}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-600)]/20 ${formData.isVisible ? 'bg-[var(--primary-600)]' : 'bg-gray-200'
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
                                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-[var(--primary-600)]/10 focus:border-[var(--primary-600)] transition-all outline-none dark:text-white"
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
                                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-[var(--primary-600)]/10 focus:border-[var(--primary-600)] transition-all outline-none dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-4 p-8 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-black/20 sticky bottom-0 z-20">
                    <button
                        onClick={onClose}
                        className="flex-1 h-14 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/10 transition-all active:scale-95"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 h-14 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 dark:shadow-none transition-all active:scale-95 disabled:bg-gray-200 disabled:shadow-none"
                        disabled={isLoading || !formData.name || !formData.price || !formData.durationMinutes}
                    >
                        {isLoading ? 'Processing...' : (editingService ? 'Update Service' : 'Initialize Service')}
                    </button>
                </div>
            </div>
        </div>
    );
}
