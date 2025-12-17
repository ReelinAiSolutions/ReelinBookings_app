import React, { useState } from 'react';
import { Service } from '@/types';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, X } from 'lucide-react';
import { createService, deleteService } from '@/services/dataService';

interface ServiceManagerProps {
    services: Service[];
    orgId: string;
    onRefresh: () => void;
}

export default function ServiceManager({ services, orgId, onRefresh }: ServiceManagerProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [newService, setNewService] = useState({
        name: '',
        price: '',
        duration: '',
        description: ''
    });

    const handleCreate = async () => {
        setIsLoading(true);
        try {
            await createService({
                name: newService.name,
                price: parseFloat(newService.price),
                durationMinutes: parseInt(newService.duration),
                description: newService.description,
                imageUrl: ''
            }, orgId);
            setIsCreating(false);
            setNewService({ name: '', price: '', duration: '', description: '' });
            onRefresh();
        } catch (e) {
            console.error(e);
            alert("Failed to create service");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await deleteService(id, orgId);
            onRefresh();
        } catch (e) {
            console.error(e);
            alert("Failed to delete service");
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Service Management</h3>
                <Button size="sm" onClick={() => setIsCreating(true)}><Plus className="w-4 h-4 mr-1" /> Add Service</Button>
            </div>

            {isCreating && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-sm">New Service</h4>
                        <button onClick={() => setIsCreating(false)}><X className="w-4 h-4 text-gray-500" /></button>
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
                        onClick={handleCreate}
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
                        <Button size="sm" variant="outline" onClick={() => handleDelete(service.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
