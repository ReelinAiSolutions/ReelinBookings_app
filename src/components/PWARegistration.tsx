'use client';

import { useEffect } from 'react';

export default function PWARegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            const register = () => {
                navigator.serviceWorker.register('/sw.js').then(
                    (registration) => {
                        console.log('SW registration successful with scope: ', registration.scope);
                    },
                    (registrationError) => {
                        console.error('SW registration failed: ', registrationError);
                    }
                );
            };

            const isSecure = window.isSecureContext;
            console.log('PWA Registration Check:', { isSecure, protocol: window.location.protocol });

            if (document.readyState === 'complete') {
                register();
            } else {
                window.addEventListener('load', register);
                return () => window.removeEventListener('load', register);
            }
        } else {
            console.warn('Service Workers are not supported in this browser or context.');
        }
    }, []);

    return null; // This component doesn't render anything
}
