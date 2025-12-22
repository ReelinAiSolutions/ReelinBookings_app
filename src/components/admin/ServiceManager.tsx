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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">Service Catalog</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage your services with photos, categories, and pricing
                        </p>
                    </div>
                    <Button
                        onClick={handleAddNew}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Service
                    </Button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="p-6 border-b border-gray-200 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search services..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category ?? 'All')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === category
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {category}
                            {category !== 'All' && (
                                <span className="ml-2 text-xs opacity-75">
                                    ({services.filter(s => s.category === category).length})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* View Toggle */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
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

            {/* Services Grid/List */}
            <div className="p-6">
                {filteredServices.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <Plus className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {searchQuery || selectedCategory !== 'All' ? 'No services found' : 'No services yet'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery || selectedCategory !== 'All'
                                ? 'Try adjusting your search or filters'
                                : 'Get started by adding your first service'}
                        </p>
                        {!searchQuery && selectedCategory === 'All' && (
                            <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="w-5 h-5 mr-2" />
                                Add Your First Service
                            </Button>
                        )}
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
            />
        </div>
    );
}
