import React, { useState } from 'react';
import { Service } from '@/types';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, X, Edit2 } from 'lucide-react';
import { createService, deleteService, updateService } from '@/services/dataService';
import { useToast } from '@/context/ToastContext';

interface ServiceManagerProps {
    services: Service[];
    orgId: string;
    onRefresh: () => void;
}

export default function ServiceManager({ services, orgId, onRefresh }: ServiceManagerProps) {
    const { toast } = useToast();
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [newService, setNewService] = useState({
        name: '',
        price: '',
        duration: '',
        description: ''
    });

    const handleSave = async () => {
        setIsLoading(true);
        try {
            if (editingId) {
                await updateService(editingId, {
                    name: newService.name,
                    price: parseFloat(newService.price),
                    durationMinutes: parseInt(newService.duration),
                    description: newService.description,
                }, orgId);
            } else {
                await createService({
                    name: newService.name,
                    price: parseFloat(newService.price),
                    durationMinutes: parseInt(newService.duration),
                    description: newService.description,
                    imageUrl: ''
                }, orgId);
            }
            setIsCreating(false);
            setEditingId(null);
            setNewService({ name: '', price: '', duration: '', description: '' });
            setNewService({ name: '', price: '', duration: '', description: '' });
            onRefresh();
            toast('Service saved successfully', 'success');
        } catch (e) {
            console.error(e);
            toast('Failed to save service', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const startEdit = (service: Service) => {
        setNewService({
            name: service.name,
            price: service.price.toString(),
            duration: service.durationMinutes.toString(),
            description: service.description
        });
        setEditingId(service.id);
        setIsCreating(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await deleteService(id, orgId);
            await deleteService(id, orgId);
            onRefresh();
            toast('Service deleted', 'success');
        } catch (e) {
            console.error(e);
            toast('Failed to delete service', 'error');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Service Management</h3>
                {!isCreating && <Button size="sm" onClick={() => {
                    setNewService({ name: '', price: '', duration: '', description: '' });
                    setEditingId(null);
                    setIsCreating(true);
                }}><Plus className="w-4 h-4 mr-1" /> Add Service</Button>}
            </div>

            {isCreating && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-sm">{editingId ? 'Edit Service' : 'New Service'}</h4>
                        <button onClick={() => {
                            setIsCreating(false);
                            setEditingId(null);
                        }}><X className="w-4 h-4 text-gray-500" /></button>
                    </div>
                    <input
                        className="w-full p-2 rounded border"
                        placeholder="Service Name (e.g. Haircut)"
                        value={newService.name}
                        onChange={e => setNewService({ ...newService, name: e.target.value })}
                    />
                    <div className="flex gap-2">
                        <input
                            className="w-full p-2 rounded border"
                            type="number"
                            placeholder="Price ($)"
                            value={newService.price}
                            onChange={e => setNewService({ ...newService, price: e.target.value })}
                        />
                        <input
                            className="w-full p-2 rounded border"
                            type="number"
                            placeholder="Duration (min)"
                            value={newService.duration}
                            onChange={e => setNewService({ ...newService, duration: e.target.value })}
                        />
                    </div>
                    <textarea
                        className="w-full p-2 rounded border"
                        placeholder="Description..."
                        rows={2}
                        value={newService.description}
                        onChange={e => setNewService({ ...newService, description: e.target.value })}
                    />
                    <Button
                        size="sm"
                        className="w-full bg-primary-600 text-white"
                        onClick={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save Service'}
                    </Button>
                </div>
            )}

            <p className="text-gray-500 text-sm mb-4">
                Manage your service catalog. Use the AI tool on the right to help generate compelling descriptions.
            </p>
            <div className="space-y-4">
                {services.map(service => (
                    <div key={service.id} className="border p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <h4 className="font-bold">{service.name}</h4>
                            <p className="text-sm text-gray-500">{service.durationMinutes} mins • ${service.price}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(service)}>
                                <Edit2 className="w-4 h-4 text-gray-500" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(service.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
