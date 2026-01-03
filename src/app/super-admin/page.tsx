import { createClient } from '@/lib/supabase';
'use client';

import React, { useState, useEffect } from 'react';
import { getInvitations, createInvitation, deleteInvitation } from '@/services/dataService';
import { Plus, Trash2, Copy, Check, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';



export default function SuperAdminPage() {
    const [invites, setInvites] = useState<any[]>([]);
    const [newCode, setNewCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Security State
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        checkAccess();
    }, []);

    const checkAccess = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        // SECURITY: Email Allowlist
        // We defer to an Environment Variable to keep the code clean
        const ALLOWED_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

        if (user && user.email && user.email === ALLOWED_EMAIL) {
            setIsAuthorized(true);
            loadInvites();
        } else {
            setIsAuthorized(false);
        }
        setAuthChecking(false);
    };


    const loadInvites = async () => {
        const data = await getInvitations(); // Fetches all invites
        setInvites(data);
    };

    const handleCreate = async () => {
        if (!newCode) return;
        setIsLoading(true);
        try {
            // 'owner' role allows creating a new org (org_id is null)
            await createInvitation(newCode, 'owner');
            setNewCode('');
            loadInvites();
        } catch (error) {
            alert('Error creating code (might be duplicate)');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Revoke this code?')) return;
        await deleteInvitation(id);
        loadInvites();
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const generateRandomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewCode(`OWNER-${result}`);
    };

    if (authChecking) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Restricted Area</h1>
                <p className="text-gray-500 max-w-md mx-auto mb-8">
                    This console is locked to the Super Administrator account only.
                    Your current account is not authorized.
                </p>
                <div className="flex gap-4">
                    <Button onClick={() => window.location.href = '/'} variant="outline">
                        Return Home
                    </Button>
                    <Button onClick={() => window.location.href = '/login'}>
                        Log In as Admin
                    </Button>
                </div>
                <div className="mt-12 text-xs text-gray-400 font-mono">
                    SECURE_CONTEXT: {process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL ? 'CONFIGURED' : 'MISSING_ENV'}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 bg-gray-900 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldAlert className="w-8 h-8 text-yellow-400" />
                            <h1 className="text-2xl font-black tracking-tight">Super Admin Console</h1>
                        </div>
                        <p className="text-gray-400">Manage invitations for new Business Owners.</p>
                    </div>

                    <div className="p-8">
                        {/* Generator */}
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-8">
                            <label className="block text-sm font-bold text-gray-900 mb-2">Generate New Owner Key</label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={newCode}
                                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                        placeholder="e.g. OWNER-XYZ123"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 font-mono text-lg uppercase focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                    />
                                    <button
                                        onClick={generateRandomCode}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:underline"
                                    >
                                        AUTO-GEN
                                    </button>
                                </div>
                                <Button
                                    onClick={handleCreate}
                                    isLoading={isLoading}
                                    disabled={!newCode}
                                    className="bg-black text-white px-6 font-bold rounded-lg hover:bg-gray-800"
                                >
                                    Create Key
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                ⚠️ These keys allow creating a brand new Organization Admin account. Share carefully.
                            </p>
                        </div>

                        {/* List */}
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Active Keys</h3>
                        <div className="space-y-3">
                            {invites.filter(i => i.role === 'owner').length === 0 && (
                                <p className="text-gray-400 italic">No active owner keys.</p>
                            )}

                            {invites.filter(i => i.role === 'owner').map(invite => (
                                <div key={invite.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white ${invite.used_at ? 'bg-gray-300' : 'bg-green-500'}`}>
                                            {invite.used_at ? '✓' : 'KEY'}
                                        </div>
                                        <div>
                                            <div className="font-mono font-bold text-lg text-gray-900">{invite.code}</div>
                                            <div className="text-xs text-gray-500">
                                                Created {new Date(invite.created_at).toLocaleDateString()}
                                                {invite.used_at && <span className="ml-2 text-green-600 font-bold">• Claimed {new Date(invite.used_at).toLocaleDateString()}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {!invite.used_at && (
                                            <button
                                                onClick={() => copyToClipboard(invite.code, invite.id)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Copy Code"
                                            >
                                                {copiedId === invite.id ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(invite.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Revoke"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
