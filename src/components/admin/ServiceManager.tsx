import React, { useState, useMemo } from 'react';
import { Service } from '@/types';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Grid, List } from 'lucide-react';
import { createService, deleteService, updateService, checkActiveAppointments } from '@/services/dataService';
import { useToast } from '@/context/ToastContext';
import ServiceCard from './ServiceCard';
import ServiceFormModal from './ServiceFormModal';

interface ServiceManagerProps {
    services: Service[];
    orgId: string;
    onRefresh: () => void;
}

export default function ServiceManager({ services, orgId, onRefresh }: ServiceManagerProps) {
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Extract unique categories
    const categories = useMemo(() => {
        const cats = new Set(services.map(s => s.category).filter(Boolean));
        return ['All', ...Array.from(cats)];
    }, [services]);

    // Filter services
    const filteredServices = useMemo(() => {
        return services.filter(service => {
            const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                service.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [services, searchQuery, selectedCategory]);

    const handleSave = async (data: Partial<Service>) => {
        try {
            // Validation
            if (!data.name?.trim()) {
                toast('Name is required', 'error');
                return;
            }
            if (!data.price || data.price < 0) {
                toast('Price must be 0 or greater', 'error');
                return;
            }
            if (!data.durationMinutes || data.durationMinutes < 1) {
                toast('Duration must be at least 1 minute', 'error');
                return;
            }

            if (editingService) {
                await updateService(editingService.id, data, orgId);
                toast('Service updated successfully', 'success');
            } else {
                await createService({
                    name: data.name,
                    price: data.price,
                    durationMinutes: data.durationMinutes,
                    description: data.description || '',
                    imageUrl: data.imageUrl || '',
                    category: data.category,
                    categoryColor: data.categoryColor,
                    isVisible: data.isVisible,
                    bufferTimeMinutes: data.bufferTimeMinutes,
                    depositRequired: data.depositRequired,
                    depositAmount: data.depositAmount,
                    cancellationHours: data.cancellationHours,
                    maxCapacity: data.maxCapacity,
                }, orgId);
                toast('Service created successfully', 'success');
            }

            setIsModalOpen(false);
            setEditingService(null);
            onRefresh();
        } catch (e) {
            console.error(e);
            toast('Failed to save service', 'error');
        }
    };

    const handleEdit = (service: Service) => {
        setEditingService(service);
        setIsModalOpen(true);
    };

    const handleDelete = async (service: Service) => {
        if (!confirm(`Are you sure you want to delete "${service.name}"?`)) return;

        try {
            const activeCount = await checkActiveAppointments('service', service.id);
            if (activeCount > 0) {
                toast(`Cannot delete: This service has ${activeCount} active appointments.`, 'error');
                return;
            }

            await deleteService(service.id, orgId);
            onRefresh();
            toast('Service deleted', 'success');
        } catch (e) {
            console.error(e);
            toast('Failed to delete service', 'error');
        }
    };

    const handleAddNew = () => {
        setEditingService(null);
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500 pt-8 px-4 sm:px-6 lg:px-0 lg:pt-0">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                        Service Menu
                    </h2>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Grid className="w-4 h-4" />
                        {services.length} Total Services
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="relative group w-full md:w-96">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#d946ef] transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A855F7]/20 focus:border-[#d946ef] transition-all bg-white dark:bg-white/5 dark:text-white"
                        />
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-gradient-to-r from-[#A855F7] to-[#d946ef] hover:opacity-90 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#d946ef]/20 active:scale-95 text-sm"
                    >
                        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" strokeWidth={3} />
                        New Service
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 bg-gray-100/80 dark:bg-white/5 p-3 rounded-[24px] border border-transparent">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 px-1">
                    {categories.map((category) => <button
                        key={category}
                        onClick={() => setSelectedCategory(category || 'All')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedCategory === category
                            ? 'bg-[#F3E8FF] dark:bg-primary-900/20 text-[#A855F7] dark:text-primary-400 border-[#A855F7]/20 dark:border-primary-500/20'
                            : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
                            }`}
                    >
                        {category}
                    </button>
                    )}
                </div>

                <div className="flex gap-1 bg-gray-200/50 dark:bg-white/10 p-1 rounded-xl">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-black text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        <Grid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-black text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Services Grid/List */}
            <div className="flex-1">
                {filteredServices.length === 0 ? (
                    <div className="h-96 flex flex-col items-center justify-center text-center bg-white rounded-[32px] border border-gray-100 border-dashed">
                        <div className="w-16 h-16 mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                            <Plus className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-[900] text-gray-900 mb-1">
                            {searchQuery || selectedCategory !== 'All' ? 'No results found' : 'No services yet'}
                        </h3>
                        <p className="text-gray-500 mb-6 text-sm max-w-xs mx-auto">
                            {searchQuery || selectedCategory !== 'All'
                                ? 'Try adjusting your search or filters'
                                : 'Get started by adding your first service to the roster'}
                        </p>
                    </div>
                ) : (
                    <div className={
                        viewMode === 'grid'
                            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                            : 'space-y-4'
                    }>
                        {filteredServices.map((service) => (
                            <ServiceCard
                                key={service.id}
                                service={service}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Form Modal */}
            <ServiceFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingService(null);
                }}
                onSave={handleSave}
                editingService={editingService}
                existingCategories={categories.filter((c): c is string => c !== 'All' && !!c)}
            />
        </div>
    );
}
