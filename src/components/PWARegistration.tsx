'use client';

import { useEffect } from 'react';

export default function PWARegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            const register = () => {
                navigator.serviceWorker.register('/sw.js').then(
                    (registration) => {
                    },
                    (registrationError) => {
                        console.error('SW registration failed: ', registrationError);
                    }
                );
            };

            const isSecure = window.isSecureContext;

            if (document.readyState === 'complete') {
                register();
            } else {
                window.addEventListener('load', register);
                return () => window.removeEventListener('load', register);
            }
        } else {
        }
    }, []);

    return null; // This component doesn't render anything
}
