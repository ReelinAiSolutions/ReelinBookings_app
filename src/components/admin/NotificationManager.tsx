'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Bell, BellOff, CheckCircle2, AlertCircle, Smartphone, RefreshCcw } from 'lucide-react';
import { savePushSubscription, getUserProfile, getStaff, getCurrentUserOrganization, linkStaffAccount } from '@/services/dataService';
import { Staff } from '@/types';

const VAPID_PUBLIC_KEY = 'BCq4foOEzbw2NR8k31xmuBkDnt_ZHmEbJQV-P6U8rX8CIcycj0-p00lYF12lJ2ZbMAG9MiQPtMCmcoJa_GtGeGU';
import { syncSubscription } from '@/services/dataService';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

interface NotificationManagerProps {
    orgId?: string;
}

export default function NotificationManager({ orgId }: NotificationManagerProps = {}) {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message: string; diagnostic?: string; raw?: any } | null>(null);

    const supabase = createClient();

    useEffect(() => {
        checkSupport();
    }, []);

    const isLocalhost = () =>
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

    const checkSupport = async () => {
        const isSecure = window.isSecureContext;
        const hasSW = 'serviceWorker' in navigator;
        const hasPushConstructor = 'PushManager' in window;
        const hasPushInSWProto = 'pushManager' in ServiceWorkerRegistration.prototype;
        const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

        // Final verdict: many browsers need to see the constructor or the prototype instance
        const hasPush = hasPushConstructor || hasPushInSWProto;
        const supported = isSecure && hasSW && hasPush;

        setIsSupported(supported);

        if (!supported) {
            setError({
                message: 'Device Support Check Failed',
                diagnostic: `Secure: ${isSecure ? 'Yes' : 'No'} | SW: ${hasSW ? 'Yes' : 'No'} | Push: ${hasPush ? 'Yes' : 'No'} (C:${hasPushConstructor ? 'Y' : 'N'}/P:${hasPushInSWProto ? 'Y' : 'N'}) | Standalone: ${isStandalone ? 'Yes' : 'No'}`
            });
        }

        if (supported) {
            setPermission(Notification.permission);
            try {
                const registration = await Promise.race([
                    navigator.serviceWorker.ready,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('SW_TIMEOUT')), 5000))
                ]) as ServiceWorkerRegistration;

                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);

                // SILENT SYNC: If user is logged in and sub exists, ensure they are linked
                if (subscription) {
                    const { profile } = await getUserProfile() || {};
                    if (profile?.id) {
                        try {
                            await syncSubscription(profile.id, subscription);
                            console.log('[NotificationManager] Identity synced successfully.');
                        } catch (syncErr) {
                            console.warn('[NotificationManager] Sync failed:', syncErr);
                        }
                    }
                }
            } catch (err: any) {
                console.warn('Initial SW Check:', err.message);
            }
        }
        setLoading(false);
    };

    const resetSubscription = async () => {
        setLoading(true);
        setError(null);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
            }
            setIsSubscribed(false);
            await subscribe();
        } catch (err: any) {
            setError({ message: 'Failed to reset: ' + err.message, diagnostic: err.name });
            setLoading(false);
        }
    }

    const subscribe = async () => {
        setLoading(true);
        setError(null);
        try {
            const registration = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Service Worker is taking too long to respond. Please refresh the page.')), 10000))
            ]) as ServiceWorkerRegistration;

            console.log('Service Worker Ready. Requesting Permission...');

            const result = await Notification.requestPermission();
            console.log('Notification Permission Result:', result);
            setPermission(result);

            if (result !== 'granted') {
                throw new Error('Permission not granted for notifications. Please check your browser settings.');
            }

            console.log('Subscribing to Push Service...');
            if (!registration.pushManager) {
                throw new Error('Your browser supports Service Workers but the Push API is missing or disabled.');
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            console.log('Push Subscription Object Obtained:', subscription);

            const { profile } = await getUserProfile() || {};
            if (profile?.id) {
                await linkStaffAccount(); // Self-healing: link on subscribe
                await savePushSubscription(profile.id, subscription);
                setIsSubscribed(true);
                console.log('Subscription Workflow Complete!');
            } else {
                throw new Error('User session not found.');
            }

        } catch (err: any) {
            // Log with name and message so Next.js overlay shows them even if 'err' logs as {}
            console.error('Subscription error detailed:', err.name || 'Error', err.message || 'No message', err);

            // DOMExceptions have properties that don't stringify well, so we pull them manually
            setError({
                message: err.message || 'Failed to subscribe.',
                diagnostic: `${err.name || 'Error'}: ${err.code || ''}`,
                raw: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
            });
        } finally {
            setLoading(false);
        }
    };

    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const { profile } = await getUserProfile() || {};
            setProfile(profile);
        };
        fetchProfile();
    }, []);

    const toggleReceiveAll = async () => {
        if (!profile) return;
        const newValue = !profile.receive_all_notifications;
        const { error } = await supabase
            .from('profiles')
            .update({ receive_all_notifications: newValue })
            .eq('id', profile.id);

        if (!error) {
            setProfile({ ...profile, receive_all_notifications: newValue });
        }
    };

    if (loading && !isSupported) return null;

    return (
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-[32px] p-8 border border-gray-100 dark:border-white/10 shadow-sm transition-all duration-500 hover:shadow-xl group">
            <div className="flex flex-col sm:flex-row items-start gap-8">
                <div className={`p-4 rounded-[20px] transition-all duration-700 shadow-2xl group-hover:scale-110 group-hover:rotate-3 ${isSubscribed ? 'bg-emerald-600 text-white shadow-emerald-500/30' : 'bg-primary-600 text-white shadow-primary-500/30'}`}>
                    {isSubscribed ? <Bell className="w-8 h-8 animate-pulse" /> : <BellOff className="w-8 h-8" />}
                </div>
                <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <h3 className="text-2xl font-[950] text-gray-900 dark:text-white tracking-tight">System Alerts</h3>
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-1">Direct Mobile Synchronization</p>
                        </div>
                        {isSubscribed && (
                            <button
                                onClick={resetSubscription}
                                className="p-2.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[15px] transition-all hover:rotate-180 duration-700"
                                title="Reset Connection"
                            >
                                <RefreshCcw className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed font-medium">
                        Enable elite responsiveness. Receive instant session updates, client arrivals, and scheduling shifts directly on your mobile device.
                    </p>

                    {/* Pro Feature: Admin Broadcast Toggle */}
                    {profile?.role === 'owner' && (
                        <div className="mb-10 p-6 bg-gray-950 dark:bg-white/5 rounded-[24px] border border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full blur-3xl" />
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-[15px] border border-white/10">
                                        <Smartphone className="w-5 h-5 text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-[950] text-white tracking-tight">Organization Command</p>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Listen to all staff activity</p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleReceiveAll}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-500 focus:outline-none ${profile.receive_all_notifications !== false ? 'bg-primary-600 shadow-lg shadow-primary-500/20' : 'bg-white/10'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xl transition-all duration-500 ${profile.receive_all_notifications !== false ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    )}

                    {!isSupported ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-[20px] text-sm border border-amber-500/20 font-black tracking-tight">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>Safari Engine detected: Tap <strong className="text-amber-700 dark:text-amber-300">Share</strong> & select <strong className="text-amber-700 dark:text-amber-300">"Add to Home Screen"</strong> for full synchronization.</p>
                            </div>

                            {error && (
                                <div className="p-5 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[24px] text-[10px] font-bold text-gray-400">
                                    <p className="uppercase tracking-[0.2em] mb-2 opacity-60">System Diagnostics</p>
                                    <p className="mb-1">{error.diagnostic}</p>
                                    <p className="mb-1">NODE: {window.location.hostname}</p>
                                    <p>IOS_STANDALONE: {(window.navigator as any).standalone ? 'YES' : 'NO'}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {isSubscribed ? (
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-black text-[11px] uppercase tracking-[0.2em] bg-emerald-500/10 px-5 py-3 rounded-[15px] w-fit border border-emerald-500/20 shadow-sm">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Connection Optimized</span>
                                    </div>

                                    <button
                                        onClick={async () => {
                                            const { profile } = await getUserProfile() || {};
                                            if (!profile?.id) return alert('User not found');

                                            try {
                                                await linkStaffAccount(); // Healing on test
                                                await fetch('/api/push-notifications', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        userId: profile.id,
                                                        title: 'Test Notification 🔔',
                                                        body: 'If you see this, notifications are working!',
                                                        url: '/staff',
                                                        type: 'manual_test'
                                                    })
                                                });
                                            } catch (e) {
                                                alert('Test failed: ' + (e as Error).message);
                                            }
                                        }}
                                        className="text-xs font-bold text-purple-600 hover:text-purple-700 underline text-left"
                                    >
                                        Send Test Alert (Server)
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={subscribe}
                                    disabled={loading}
                                    className="flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-[20px] font-[950] uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-primary-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 w-full sm:w-auto"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Smartphone className="w-4 h-4" />
                                            Synchronize Device
                                        </>
                                    )}
                                </button>
                            )}

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-2">
                                    <p className="text-sm text-red-700 font-bold mb-1">{error.message}</p>
                                    <p className="text-[10px] text-red-400 font-mono mb-2 uppercase tracking-tighter">Code: {error.diagnostic}</p>

                                    {error.raw && (
                                        <details className="mt-2 group">
                                            <summary className="text-[10px] text-red-300 cursor-pointer hover:text-red-500 transition-colors">Technical Details</summary>
                                            <pre className="mt-1 p-2 bg-red-100/30 rounded text-[9px] text-red-800 overflow-x-auto whitespace-pre-wrap">
                                                {JSON.stringify(error.raw, null, 2)}
                                            </pre>
                                        </details>
                                    )}

                                    <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={subscribe}
                                            className="text-[11px] bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-700 transition-colors"
                                        >
                                            Try Again
                                        </button>
                                        {error.message.includes('Service Worker') && (
                                            <p className="text-[10px] text-red-600 self-center">
                                                Still failing? Clear site data or restart browser.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div >
    );
}
