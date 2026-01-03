'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle2, AlertCircle, Smartphone, RefreshCcw } from 'lucide-react';
import { savePushSubscription, getUserProfile, getStaff, getCurrentUserOrganization, linkStaffAccount } from '@/services/dataService';
import { Staff } from '@/types';

const VAPID_PUBLIC_KEY = 'BKNoqzLYTe_AB1yvw9vwZ4u4RJbWZ98c-2R3CShWpP4j2mRxCNEnR-RfyM_nQbXKI9tJdfPimoCYCNrWyTyV6cc';

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

export default function NotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message: string; diagnostic?: string; raw?: any } | null>(null);

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

    if (loading && !isSupported) return null;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 transition-all duration-300">
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${isSubscribed ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                    {isSubscribed ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-bold text-gray-900">Mobile Notifications</h3>
                        {isSubscribed && (
                            <button
                                onClick={resetSubscription}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Reset Connection"
                            >
                                <RefreshCcw className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                        Receive instant alerts on your phone screen when clients book or cancel appointments.
                    </p>

                    {!isSupported ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-100 font-medium">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <p>To enable, please tap the <strong>Share</strong> button in Safari and select <strong>"Add to Home Screen"</strong>.</p>
                            </div>

                            {error && (
                                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-mono text-gray-400">
                                    <p className="uppercase font-bold mb-1 opacity-50">Debug Diagnostics:</p>
                                    <p>{error.diagnostic}</p>
                                    <p className="mt-1">Hostname: {window.location.hostname}</p>
                                    <p>iOS Standalone: {(window.navigator as any).standalone ? 'Yes' : 'No'}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {isSubscribed ? (
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-2 rounded-lg w-fit">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Notifications Active</span>
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
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 underline text-left"
                                    >
                                        Send Test Alert (Server)
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={subscribe}
                                    disabled={loading}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                >
                                    <Smartphone className="w-4 h-4" />
                                    {loading ? 'Processing...' : 'Enable on this Device'}
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
